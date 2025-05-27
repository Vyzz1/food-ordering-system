import { Router, RequestHandler } from "express";
import validateJWT from "../middlewares/validateJWT";
import { AuthenticatedTypedRequest } from "../types/auth";
import validateSchema from "../middlewares/validateSchema";
import { addressSchema } from "../validation/address";
import { addressController } from "../controllers/address.controller";

const addressRouter = Router();

addressRouter.use(validateJWT);

addressRouter.get("/", addressController.getAllAddresses);

addressRouter.post(
  "/",
  validateSchema(addressSchema),
  addressController.createAddress
);

addressRouter.put(
  "/:id",
  validateSchema(addressSchema),
  addressController.updateAddress
);

addressRouter.put("/setDefault/:id", addressController.setDefaultAddress);

addressRouter.delete("/:id", addressController.deleteAddress);

export default addressRouter;
