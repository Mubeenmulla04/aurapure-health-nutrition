import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../models/user.model.js';
import { Role } from '../../models/role.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { STAFF_ROLES } from '../../middleware/role.middleware.js';

export class StaffController {
  /**
   * List all staff accounts
   */
  static async listStaff(_req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await User.find({ role: { $in: STAFF_ROLES } })
        .select('-passwordHash -refreshTokenHash -passwordResetToken')
        .populate('roleId', 'name description permissions')
        .sort({ createdAt: -1 });

      ApiResponse.success({
        res,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all predefined system roles
   */
  static async listRoles(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await Role.find({ name: { $ne: 'customer' } }).sort({ name: 1 });
      ApiResponse.success({
        res,
        data: { roles },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new staff account
   */
  static async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, role } = req.body;
      const rawPhone = phone || req.body.mobileNumber || '';
      const mobileNumber = String(rawPhone).replace(/\D/g, '').slice(-10);

      if (!name || !mobileNumber || !role) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Name, 10-digit mobile number, and role are required for staff accounts.',
        });
        return;
      }

      if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'INVALID_MOBILE_NUMBER',
          message: 'Please provide a valid 10-digit Indian mobile number starting with 6-9.',
        });
        return;
      }

      if (!STAFF_ROLES.includes(role)) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'INVALID_ROLE',
          message: `Role must be one of: ${STAFF_ROLES.join(', ')}`,
        });
        return;
      }

      // Check if phone is already registered
      const existingPhone = await User.findOne({ mobileNumber });
      if (existingPhone) {
        ApiResponse.error({
          res,
          statusCode: 409,
          code: 'PHONE_ALREADY_EXISTS',
          message: 'A user or staff member with this mobile number already exists.',
        });
        return;
      }

      // Only super_admin can create another super_admin
      if (role === 'super_admin' && req.user?.role !== 'super_admin') {
        ApiResponse.error({
          res,
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Only a Super Admin can create another Super Admin account.',
        });
        return;
      }

      if (email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
          ApiResponse.error({
            res,
            statusCode: 409,
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'A user with this email address already exists.',
          });
          return;
        }
      }

      const roleDoc = await Role.findOne({ name: role });

      const staff = await User.create({
        name: name.trim(),
        fullName: name.trim(),
        mobileNumber,
        countryCode: '+91',
        phone: mobileNumber,
        email: email ? email.toLowerCase().trim() : undefined,
        role,
        roleId: roleDoc?._id,
        isActive: true,
        isMobileVerified: true,
      });

      // Audit log
      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'STAFF_CREATE',
        entity: 'STAFF',
        entityId: staff._id.toString(),
        diff: {
          after: { email: staff.email, role: staff.role, name: staff.name },
        },
      });

      const sanitized = await User.findById(staff._id)
        .select('-passwordHash -refreshTokenHash -passwordResetToken')
        .populate('roleId', 'name description permissions');

      ApiResponse.success({
        res,
        statusCode: 201,
        message: `Staff account created for ${staff.name} (${staff.role}).`,
        data: { staff: sanitized },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update staff account details or role
   */
  static async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, phone, role, isActive } = req.body;

      const staff = await User.findById(id);
      if (!staff || !STAFF_ROLES.includes(staff.role)) {
        ApiResponse.error({
          res,
          statusCode: 404,
          code: 'STAFF_NOT_FOUND',
          message: 'Staff account not found.',
        });
        return;
      }

      // Self-deactivation or self-role change protection
      if (req.user?.userId === id) {
        if (isActive === false) {
          ApiResponse.error({
            res,
            statusCode: 400,
            code: 'CANNOT_DEACTIVATE_SELF',
            message: 'You cannot deactivate your own administrative account.',
          });
          return;
        }
      }

      // If updating to or from super_admin, require current user to be super_admin
      if ((staff.role === 'super_admin' || role === 'super_admin') && req.user?.role !== 'super_admin') {
        ApiResponse.error({
          res,
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Only a Super Admin can modify a Super Admin account or promote users to Super Admin.',
        });
        return;
      }

      const beforeDiff = { name: staff.name, phone: staff.phone, role: staff.role, isActive: staff.isActive };

      if (name) staff.name = name.trim();
      if (phone !== undefined) staff.phone = phone?.trim();
      if (typeof isActive === 'boolean') staff.isActive = isActive;

      if (role && role !== staff.role) {
        if (!STAFF_ROLES.includes(role)) {
          ApiResponse.error({
            res,
            statusCode: 400,
            code: 'INVALID_ROLE',
            message: `Role must be one of: ${STAFF_ROLES.join(', ')}`,
          });
          return;
        }
        const roleDoc = await Role.findOne({ name: role });
        staff.role = role;
        staff.roleId = roleDoc?._id;
      }

      await staff.save();

      // Audit log
      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'STAFF_UPDATE',
        entity: 'STAFF',
        entityId: staff._id.toString(),
        diff: {
          before: beforeDiff,
          after: { name: staff.name, phone: staff.phone, role: staff.role, isActive: staff.isActive },
        },
      });

      const updated = await User.findById(staff._id)
        .select('-passwordHash -refreshTokenHash -passwordResetToken')
        .populate('roleId', 'name description permissions');

      ApiResponse.success({
        res,
        message: 'Staff account updated successfully.',
        data: { staff: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete or deactivate staff account
   */
  static async deleteStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (req.user?.userId === id) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'CANNOT_DELETE_SELF',
          message: 'You cannot delete your own administrative account.',
        });
        return;
      }

      const staff = await User.findById(id);
      if (!staff || !STAFF_ROLES.includes(staff.role)) {
        ApiResponse.error({
          res,
          statusCode: 404,
          code: 'STAFF_NOT_FOUND',
          message: 'Staff account not found.',
        });
        return;
      }

      if (staff.role === 'super_admin') {
        const superAdminCount = await User.countDocuments({ role: 'super_admin' });
        if (superAdminCount <= 1) {
          ApiResponse.error({
            res,
            statusCode: 400,
            code: 'LAST_SUPER_ADMIN',
            message: 'Cannot delete the only remaining Super Admin in the system.',
          });
          return;
        }
        if (req.user?.role !== 'super_admin') {
          ApiResponse.error({
            res,
            statusCode: 403,
            code: 'FORBIDDEN',
            message: 'Only a Super Admin can delete another Super Admin.',
          });
          return;
        }
      }

      await User.findByIdAndDelete(id);

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'STAFF_DELETE',
        entity: 'STAFF',
        entityId: id,
        diff: {
          before: { email: staff.email, role: staff.role, name: staff.name },
        },
      });

      ApiResponse.success({
        res,
        message: `Staff member ${staff.name} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
