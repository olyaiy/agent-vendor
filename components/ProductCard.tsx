// src/components/ProductCard.tsx
import { Product } from "@polar-sh/sdk/models/components/product.js";
import Link from "next/link";
// import { useMemo } from "react";
import { Check, ArrowRight } from "lucide-react";

interface ProductCardProps {
    product: Product
    customerId: string
}

export const ProductCard = ({ product, customerId }: ProductCardProps) => {
    // Handling just a single price for now
    // Remember to handle multiple prices for products if you support monthly & yearly pricing plans
    // const firstPrice = product.prices[0]

    // const price = useMemo(() => {
    //     switch(firstPrice.amountType) {
    //         case 'fixed':
    //             // The Polar API returns prices in cents - Convert to dollars for display
    //             return `$${firstPrice.priceAmount / 100}`
    //         case 'free':
    //             return 'Free'
    //         default:
    //             return 'Pay what you want'
    //     }
    // }, [firstPrice])


    return (
        <div className="group flex flex-col justify-between p-6 rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 h-full transition-all duration-300 hover:border-neutral-700 hover:shadow-lg hover:shadow-neutral-900/20">
            <div className="flex flex-col gap-y-6">
                <h3 className="text-2xl font-medium tracking-tight text-white">{product.name}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{product.description}</p>
                <ul className="space-y-3 mt-2">
                    {product.benefits.map((benefit) => (
                        <li key={benefit.id} className="flex items-start gap-x-3">
                            <span className="flex-shrink-0 mt-1">
                                <Check className="h-4 w-4 text-emerald-500" />
                            </span>
                            <span className="text-sm text-neutral-300">{benefit.description}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="mt-8 flex items-center justify-between">
                {/* <span className="text-xl lg: font-medium text-white">{price}</span> */}
                <Link
                    href={`/api/polar/checkout?productId=${product.id}&customerExternalId=${customerId}`}
                    className="flex items-center gap-x-2 bg-white hover:bg-neutral-100 text-black font-medium rounded-full px-4 py-2 transition-all duration-200 hover:shadow-md group-hover:scale-105"
                >
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </div>
    )
}
