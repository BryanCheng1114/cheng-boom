export interface OrderCompletionDetails {
  paymentMethod: string;
  totalAmount: number;
  itemPrice: number;
  productDiscount: number;
  sellerDiscount: number;
  deliveryMode: string;
}
