interface CreateUserRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  address: string;
  gender: string;
  dateOfBirth: string;
}

interface SendOTPRequest {
  userId: string;
  email: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface VerifyAccountRequest {
  token: string;
  otp: string;
}

interface AddressRequest {
  fullAddress: string;
  fullName: string;
  phoneNumber: string;
  specificAddress: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangeInformationRequest {
  fullName: string;
  gender: string;
  dateOfBirth: string;
}

interface ChangePhotoUrlRequest {
  photoUrl: string;
}
interface ForgotPasswordRequest {
  email: string;
  password: string;
  token: string;
  otp: string;
}

interface CategoryRequest {
  name: string;
  imageUrl: string;
}

interface FoodItemRequest {
  name: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  images: string[];
  timeEstimate: number;
  categoryId: string;
  optionGroups: OptionGroupRequest[];
}

interface OptionGroupRequest {
  id?: string;
  name: string;
  required: boolean;
  multiple: boolean;
  freeLimit: number;
  sequence: number;
  options: ItemOptionRequest[];
}

interface ItemOptionRequest {
  id?: string;
  optionName: string;
  additionalPrice: number;
  sequence: number;
}

interface FilterFoodRequest {
  search?: string;
  categoriesIds?: string[];
  page?: number;
  limit?: number;
  fromPrice?: number;
  toPrice?: number;
  sort?: string;
  rating?: string;
}

interface AdminFilterRequest extends FilterFoodRequest {
  isActives?: boolean[];
}

interface ShoppingCartRequest {
  quantity: number;
  menuItemId: string;
  options: Array<{
    optionGroupId: string;
    optionIds: string[];
  }>;
}

interface OrderRequest {
  addressId: string;
  shippingFee: number;
  paymentMethod: "stripe" | "cod" | "paypal";
  orderItems: OrderItemRequest[];
}

interface OrderItemRequest {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  orderItemsOptions: OrderItemOptionsRequest[];
}

interface OrderItemOptionsRequest {
  optionGroupId: string;
  optionItemId: string;
}

interface UserOrderFilterRequest {
  keyword?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

interface AdminOrderFilterRequest extends UserOrderFilterRequest {
  paymentMethod?: string;
  fromDate?: Date;
  toDate?: Date;
  orderStatuses?: OrderStatus[];
}

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type PaymentMethod = "stripe" | "cod" | "paypal";

interface RatingRequest {
  content: string;
  rating: number;
  menuItemId: string;
  orderItemId: string;
  images?: string[];
}

interface FilterRatingRequest {
  menuItemId?: string;
  page?: number;
  limit?: number;
  filterBy?: string;
  sortBy?: string;
}

interface AdminFilterUserRequest {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  emailConfirmed?: boolean[];
  isBanned?: boolean[];
}

interface DashboardRequest {
  fromDate?: Date;
  toDate?: Date;
}
