//augments the global Window interface to define the shape of the window.ethereum for MM
//if (window.ethereum)... will now be type-safe and won’t throw TypeScript errors
interface Window {
    ethereum?: {
        isMetaMask?: boolean
        request: (request: { method: string; params?: any[] }) => Promise<any>
        on: (eventName: string, callback: (...args: any[]) => void) => void
        removeListener: (eventName: string, callback: (...args: any[]) => void) => void
    }
}

declare module "wagmi" {
    interface Register {
        config: typeof config
    }
}
