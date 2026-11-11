import { Address, IAddress } from '../../models/address.model.js';

export class AddressService {
  static async getAddresses(userId: string) {
    return Address.find({ userId }).sort({ isDefaultShipping: -1, createdAt: -1 });
  }

  static async createAddress(userId: string, data: Partial<IAddress>) {
    if (data.isDefaultShipping) {
      await Address.updateMany({ userId }, { $set: { isDefaultShipping: false } });
    }

    const count = await Address.countDocuments({ userId });
    const isFirst = count === 0;

    const address = await Address.create({
      ...data,
      userId,
      isDefaultShipping: data.isDefaultShipping || isFirst,
    });

    return address;
  }

  static async updateAddress(userId: string, addressId: string, data: Partial<IAddress>) {
    if (data.isDefaultShipping) {
      await Address.updateMany({ userId }, { $set: { isDefaultShipping: false } });
    }

    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!address) {
      throw { statusCode: 404, code: 'ADDRESS_NOT_FOUND', message: 'Address not found.' };
    }

    return address;
  }

  static async deleteAddress(userId: string, addressId: string) {
    const address = await Address.findOneAndDelete({ _id: addressId, userId });
    if (!address) {
      throw { statusCode: 404, code: 'ADDRESS_NOT_FOUND', message: 'Address not found.' };
    }
    return address;
  }
}
