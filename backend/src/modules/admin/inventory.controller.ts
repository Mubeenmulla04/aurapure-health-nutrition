import { Request, Response, NextFunction } from 'express';
import { Inventory } from '../../models/inventory.model.js';
import { InventoryTransaction } from '../../models/inventoryTransaction.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminInventoryController {
  /**
   * List inventory master with SKU search and alertStatus filtering
   */
  static async listInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const { search, alertStatus } = req.query;
      const query: any = {};

      if (alertStatus && alertStatus !== 'ALL') {
        query.alertStatus = alertStatus;
      }

      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.sku = regex;
      }

      const total = await Inventory.countDocuments(query);
      const inventory = await Inventory.find(query)
        .populate({
          path: 'variantId',
          populate: { path: 'productId', select: 'title slug images' },
        })
        .sort({ availableStock: 1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          inventory,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adjust inventory stock atomically and write transaction ledger
   */
  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { changeQty, type, reason, note } = req.body;

      const qty = Number(changeQty);
      if (isNaN(qty) || qty === 0) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'INVALID_QUANTITY',
          message: 'changeQty must be a non-zero integer.',
        });
        return;
      }

      const inv = await Inventory.findById(id);
      if (!inv) {
        ApiResponse.error({ res, statusCode: 404, code: 'INVENTORY_NOT_FOUND', message: 'Inventory record not found.' });
        return;
      }

      inv.reservedStock = Math.max(0, inv.reservedStock || 0);
      const prevStockOnHand = inv.stockOnHand;
      const prevAvailable = inv.availableStock;
      const newStockOnHand = Math.max(0, inv.stockOnHand + qty);
      const newAvailable = Math.max(0, newStockOnHand - inv.reservedStock);

      let newAlertStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (newAvailable <= 0) {
        newAlertStatus = 'OUT_OF_STOCK';
      } else if (newAvailable <= inv.lowStockThreshold) {
        newAlertStatus = 'LOW_STOCK';
      }

      inv.stockOnHand = newStockOnHand;
      inv.availableStock = newAvailable;
      inv.alertStatus = newAlertStatus;
      await inv.save();

      // Record transaction
      let txType = type;
      if (txType === 'STOCK_IN') txType = 'PURCHASE_RECEIPT';
      else if (txType === 'STOCK_OUT') txType = 'DAMAGED_DISCARD';
      else if (!txType) txType = qty > 0 ? 'PURCHASE_RECEIPT' : 'DAMAGED_DISCARD';

      await InventoryTransaction.create({
        inventoryId: inv._id,
        variantId: inv.variantId,
        changeQuantity: qty,
        previousQuantity: prevStockOnHand,
        newQuantity: newStockOnHand,
        type: txType,
        reason: reason || note || 'Manual Admin Warehouse Adjustment',
        performedBy: req.user!.userId as any,
      });

      // Audit Log
      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'INVENTORY_ADJUST',
        entity: 'INVENTORY',
        entityId: inv._id.toString(),
        diff: {
          sku: inv.sku,
          changeQuantity: qty,
          before: { stockOnHand: prevStockOnHand, available: prevAvailable },
          after: { stockOnHand: newStockOnHand, available: newAvailable, alertStatus: newAlertStatus },
          reason: reason || note,
        },
      });

      const populated = await Inventory.findById(inv._id).populate({
        path: 'variantId',
        populate: { path: 'productId', select: 'title slug images' },
      });

      ApiResponse.success({
        res,
        message: `Stock updated for ${inv.sku}: now ${newAvailable} units available.`,
        data: { inventory: populated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction history ledger for single inventory item
   */
  static async getTransactionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const total = await InventoryTransaction.countDocuments({ inventoryId: id });
      const transactions = await InventoryTransaction.find({ inventoryId: id })
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          transactions,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
