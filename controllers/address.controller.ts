import { Response } from "express";
import { AuthenticatedRequest, AuthenticatedTypedRequest } from "../types/auth";
import { addressService } from "../services/address.service";
import errorHandler from "../utils/error";

class AddressController {
  async createAddress(
    req: AuthenticatedTypedRequest<AddressRequest>,
    res: Response
  ) {
    try {
      const address = req.body;

      const response = await addressService.creeateAddress(
        req.user?.email!,
        address
      );

      res.status(201).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async updateAddress(
    req: AuthenticatedTypedRequest<AddressRequest>,
    res: Response
  ) {
    try {
      const address = req.body;
      const id = req.params.id;

      const response = await addressService.updateAddress(id, address);

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getAllAddresses(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      const addresses = await addressService.getAllAddresses(userId!);

      res.status(200).send(addresses);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async setDefaultAddress(req: AuthenticatedTypedRequest<{}>, res: Response) {
    try {
      const id = req.params.id;

      const response = await addressService.setDefaultAddress(id);

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async deleteAddress(req: AuthenticatedTypedRequest<{}>, res: Response) {
    try {
      const id = req.params.id;

      await addressService.deleteAddress(id);

      res.sendStatus(204);
    } catch (error) {
      errorHandler(error, res);
    }
  }
}

export const addressController = new AddressController();
