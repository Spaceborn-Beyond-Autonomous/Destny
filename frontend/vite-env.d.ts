/// <reference types="vite/client" />

interface Window {
	Razorpay?: new (options: Record<string, unknown>) => {
		open: () => void;
		on: (event: string, callback: (response: unknown) => void) => void;
	};
}
