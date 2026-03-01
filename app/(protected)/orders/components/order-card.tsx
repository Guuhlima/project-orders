import { formatDate } from "@/shared/utils/date";
import { Order, getCustomerName, getOrderCreatedAt, getOrderId, getOrderLabel, isNewOrder } from "../_helpers/order-utils";

type Props = {
    order: Order;
}

export default function OrderCard({ order }: Props) {
    const createdAt = getOrderCreatedAt(order);
    const isNew = isNewOrder(createdAt, 15);

    return (
        <li className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{getCustomerName(order)}</p>
                        {isNew && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                Novo pedido
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-sm text-slate-700">{getOrderLabel(order)}</p>
                </div>

                <span className="whitespace-nowrap text-xs text-slate-500">
                    {formatDate(createdAt)}
                </span>
            </div>
        </li>
    )
}