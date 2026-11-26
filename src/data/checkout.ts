export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const VALID_CUSTOMER: CustomerInfo = {
  firstName: 'Jane',
  lastName: 'Doe',
  postalCode: '10001',
};
