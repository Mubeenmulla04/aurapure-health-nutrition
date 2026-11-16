import { Request, Response, NextFunction } from 'express';
import { StoreSettings } from '../../models/storeSettings.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class SettingsController {
  /**
   * Get store profile & business settings
   */
  static async getStoreSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      let settings = await StoreSettings.findOne().populate('updatedBy', 'name email');
      if (!settings) {
        settings = await StoreSettings.create({
          storeName: 'AuraPure Nutrition',
          legalEntityName: 'AuraPure Bio-Wellness Private Limited',
          gstin: '29AABCA1234F1Z5',
          supportEmail: 'support@aurapure.in',
          supportPhone: '+91 80 4920 1800',
          supportWhatsApp: '+91 98765 43210',
          registeredAddress: {
            line1: '108 Bio-Valley Tech Park, Whitefield',
            line2: 'Phase 2, EPIP Zone',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560066',
            country: 'India',
          },
          currency: { code: 'INR', symbol: '₹' },
          taxation: { defaultGstPercent: 18, pricesInclusiveOfGst: true },
          shipping: {
            freeShippingThreshold: 999,
            standardShippingFee: 99,
            estimatedMetroDays: 2,
            estimatedRestDays: 5,
          },
          invoice: {
            prefix: 'AP-INV-',
            nextNumber: 1001,
            termsAndConditions:
              'Thank you for choosing AuraPure Nutrition. Goods once sold are subject to our 14-day plant-purity guarantee. For queries or batch test certificates, email support@aurapure.in.',
          },
          integrations: {
            razorpayConfigured: true,
            shiprocketConfigured: true,
            whatsappConfigured: true,
            smtpConfigured: true,
          },
          seoDefaults: {
            metaTitle: 'AuraPure Nutrition — 100% Organic Plant-Based Protein & Ayurvedic Wellness',
            metaDescription:
              'Shop clean, lab-tested organic plant protein powders, Ayurvedic supplements, and daily nutrition formulated for Indian wellness.',
            metaKeywords: ['organic protein', 'plant protein india', 'ayurvedic wellness', 'vegan protein powder'],
          },
        });
      }

      ApiResponse.success({
        res,
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update store profile & business settings
   */
  static async updateStoreSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      let settings = await StoreSettings.findOne();

      if (!settings) {
        settings = new StoreSettings(updates);
      } else {
        Object.assign(settings, updates);
      }

      settings.updatedBy = req.user!.userId as any;
      await settings.save();

      // Audit log
      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'SETTINGS_UPDATE',
        entity: 'SETTINGS',
        entityId: settings._id.toString(),
        diff: { after: updates },
      });

      ApiResponse.success({
        res,
        message: 'Store settings updated successfully.',
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get paginated audit logs
   */
  static async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const { entity, action, search } = req.query;
      const query: any = {};

      if (entity && entity !== 'ALL') {
        query.entity = entity;
      }
      if (action && action !== 'ALL') {
        query.action = action;
      }
      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.$or = [{ action: regex }, { entity: regex }, { userName: regex }, { entityId: regex }];
      }

      const total = await AuditLog.countDocuments(query);
      const logs = await AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          logs,
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
