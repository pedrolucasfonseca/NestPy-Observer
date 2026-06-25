export interface PaymentStrategy {
    process(amount: number): { success: boolean; message: string };
}

// Strategy 1: pix (Rejected if amount exceeds 1500)
export class PixPayment implements PaymentStrategy {
    process(amount: number) {
        if (amount > 1500) {
            return {
                success: false,
                message: `Pix rejected: Amount of R$${amount.toFixed(2)} exceeds the limit`
            };
        }
        return {
            success: true,
            message: `Pix payment of R$${amount.toFixed(2)} processed instantly.`
        };
    }
}

// Strategy 2: credit (Rejected if amount exceeds 5000)
export class CreditPayment implements PaymentStrategy {
    process(amount: number) {
        if (amount > 5000) {
            return {
                success: false,
                message: `Card declined: Amount of R$${amount.toFixed(2)} exceeds the limit`
            };
        }
        return {
            success: true,
            message: `Credit card approved for the amount of R$${amount.toFixed(2)}`
        };
    }
}
