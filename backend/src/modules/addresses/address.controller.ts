import { Request, Response, NextFunction } from 'express';
import { AddressService } from './address.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AddressController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const addresses = await AddressService.getAddresses(req.user!.userId);
      ApiResponse.success({ res, data: { addresses } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const address = await AddressService.createAddress(req.user!.userId, req.body);
      ApiResponse.success({ res, statusCode: 201, message: 'Address created.', data: { address } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const address = await AddressService.updateAddress(req.user!.userId, req.params.id as string, req.body);
      ApiResponse.success({ res, message: 'Address updated.', data: { address } });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await AddressService.deleteAddress(req.user!.userId, req.params.id as string);
      ApiResponse.success({ res, message: 'Address deleted.' });
    } catch (error) {
      next(error);
    }
  }
}
