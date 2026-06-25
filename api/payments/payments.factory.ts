import { type PaymentStrategy, CreditPayment, PixPayment } from "./strategy.interface.js";

export class PaymentsFactory {
    static createStrategy(type: string): PaymentStrategy {
        switch (type.toLowerCase()) {
            case 'pix':
                return new PixPayment();
            case 'card':
                return new CreditPayment();
            default:
                throw new Error(`Payment method "${type}" is not supported.`);
        }
    }
}
