import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  getMonerisPaymentSession,
  clearMonerisPaymentSession,
  finalizePaymentApi,
  cancelPaymentApi,
  getPaymentSessionApi,
} from '../services/paymentService';
import {
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

const MONERIS_DIV_ID = 'moneris-checkout-widget';
const INITIALIZATION_TIMEOUT_MS = 20000;

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customerToken, clearCart, showToast } = useApp();

  const [session, setSession] = useState(() => getMonerisPaymentSession());
  const [loading, setLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizingMsg, setFinalizingMsg] = useState('Payment received. Finalizing your order...');
  const [error, setError] = useState('');
  const [isFormLoaded, setIsFormLoaded] = useState(false);

  const checkoutInstanceRef = useRef(null);
  const isFinalizingRef = useRef(false);
  const timeoutRef = useRef(null);

  // 1. Recover Session from URL params if direct navigation or refresh
  useEffect(() => {
    const attemptIdParam = searchParams.get('attempt') || searchParams.get('paymentAttemptId');
    if (!session && attemptIdParam) {
      getPaymentSessionApi(attemptIdParam)
        .then((recovered) => {
          if (recovered && recovered.ticket) {
            setSession(recovered);
          } else {
            setError('Payment session is invalid or has expired.');
            setLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Unable to retrieve payment session.');
          setLoading(false);
        });
    } else if (!session && !attemptIdParam) {
      setError('No active payment attempt found. Please return to checkout.');
      setLoading(false);
    }
  }, [searchParams, session]);

  // 2. Finalize Handler
  const handleFinalize = useCallback(
    async (trigger = 'complete') => {
      if (!session || !session.paymentAttemptId) {
        setError('Missing payment attempt identifier.');
        return;
      }

      if (isFinalizingRef.current) return;
      isFinalizingRef.current = true;
      setIsFinalizing(true);
      setError('');
      setFinalizingMsg('Payment authorized. Creating your verified order...');

      try {
        const res = await finalizePaymentApi(
          {
            paymentAttemptId: session.paymentAttemptId,
            ticket: session.ticket,
          },
          customerToken
        );

        if (res.success && res.approved && res.order) {
          clearCart();
          clearMonerisPaymentSession();
          showToast(`Order #${res.order.order_number} confirmed!`, 'success');
          navigate(`/order-success?orderId=${encodeURIComponent(res.order.order_number)}`, {
            replace: true,
          });
        } else if (!res.approved) {
          setIsFinalizing(false);
          isFinalizingRef.current = false;
          setError(res.message || 'Payment was declined by your financial institution.');
        } else {
          throw new Error(res.message || 'Payment completed, but order registration was delayed.');
        }
      } catch (err) {
        console.error('[Finalization Error]', err);
        setIsFinalizing(false);
        isFinalizingRef.current = false;
        setError(
          err.message ||
            'Your payment may have been processed, but confirmation was delayed. Please contact support before retrying.'
        );
      }
    },
    [session, customerToken, clearCart, showToast, navigate]
  );

  // 3. Cancel Handler
  const handleCancel = useCallback(async () => {
    if (session?.paymentAttemptId) {
      await cancelPaymentApi({
        paymentAttemptId: session.paymentAttemptId,
        ticket: session.ticket,
      });
    }
    clearMonerisPaymentSession();
    navigate('/checkout', { replace: true });
  }, [session, navigate]);

  // 4. Initialize Moneris Checkout
  useEffect(() => {
    if (!session || !session.ticket) return;

    if (session.ticket.startsWith('QA-SANDBOX-')) {
      setLoading(false);
      setIsFormLoaded(true);
      return;
    }

    let isMounted = true;
    const scriptUrl =
      session.checkoutScriptUrl || 'https://gatewayt.moneris.com/chkt/js/chkt_v1.00.js';

    // Helper to initialize widget once script is loaded
    const initWidget = () => {
      if (!window.monerisCheckout) {
        if (isMounted) setError('Moneris Checkout SDK failed to load.');
        return;
      }

      try {
        const checkout = new window.monerisCheckout();
        checkoutInstanceRef.current = checkout;

        checkout.setMode(session.checkoutMode || 'qa');
        checkout.setCheckoutDiv(MONERIS_DIV_ID);

        checkout.setCallback('page_loaded', () => {
          if (isMounted) {
            setIsFormLoaded(true);
            setLoading(false);
          }
        });

        checkout.setCallback('payment_receipt', () => {
          handleFinalize('payment_receipt');
        });

        checkout.setCallback('payment_complete', () => {
          handleFinalize('payment_complete');
        });

        checkout.setCallback('cancel_transaction', () => {
          handleCancel();
        });

        checkout.setCallback('error_event', (err) => {
          console.error('[Moneris Widget Error]', err);
          if (isMounted) {
            setError('Payment gateway error. Please try again or use another payment method.');
            setLoading(false);
          }
        });

        checkout.startCheckout(session.ticket);
      } catch (err) {
        console.error('[Moneris Start Checkout Exception]', err);
        if (isMounted) {
          setError('Failed to start Moneris checkout: ' + err.message);
          setLoading(false);
        }
      }
    };

    // Load Script dynamically
    const existingScript = document.getElementById('moneris-checkout-script');
    if (window.monerisCheckout) {
      initWidget();
    } else if (existingScript) {
      existingScript.addEventListener('load', initWidget, { once: true });
    } else {
      const script = document.createElement('script');
      script.id = 'moneris-checkout-script';
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        if (isMounted) initWidget();
      };
      script.onerror = () => {
        if (isMounted) {
          setError('Unable to load secure Moneris payment gateway script.');
          setLoading(false);
        }
      };
      document.head.appendChild(script);
    }

    // Fallback timeout in case iframe hangs
    timeoutRef.current = setTimeout(() => {
      if (!isFormLoaded && isMounted) {
        setLoading(false);
      }
    }, INITIALIZATION_TIMEOUT_MS);

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (checkoutInstanceRef.current?.closeCheckout) {
        try {
          checkoutInstanceRef.current.closeCheckout();
        } catch {
          // Ignore
        }
      }
    };
  }, [session, handleFinalize, handleCancel, isFormLoaded]);

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Navigation header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancel}
            disabled={isFinalizing}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Review
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            PCI-DSS SAQ-A Certified
          </div>
        </div>

        {/* Main Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center pb-6 border-b border-slate-100">
            <span className="text-xs font-mono uppercase tracking-widest text-[#488203] font-bold block mb-1">
              Moneris Hosted Payment Gateway
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 uppercase">
              Secure Card Checkout
            </h1>
            {session?.amount && (
              <p className="text-sm font-semibold text-slate-600 mt-2">
                Order Total: <strong className="text-slate-900 font-black text-lg">${session.amount} CAD</strong>
              </p>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="my-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-bold">Transaction Alert</strong>
                <span>{error}</span>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-xs font-bold text-rose-900 hover:bg-rose-100 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Payment
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent text-xs font-bold text-rose-700 hover:underline"
                  >
                    Back to Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Finalization Progress Overlay */}
          {isFinalizing && (
            <div className="my-10 p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#488203] animate-spin mx-auto" />
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 uppercase">
                  Processing Verification
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                  {finalizingMsg}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Please do not refresh or close this browser window.
              </p>
            </div>
          )}

          {/* Loading form spinner */}
          {loading && !error && !isFinalizing && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#488203] animate-spin mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Connecting to Moneris Hosted Gateway...
              </p>
            </div>
          )}

          {/* Moneris QA Sandbox Interactive Terminal */}
          {session?.ticket?.startsWith('QA-SANDBOX-') && !isFinalizing && (
            <div className="my-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Moneris QA Sandbox • $0.00 Charged
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">{session.ticket}</span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>This is the <strong>Moneris Official QA Test Sandbox</strong>. No real credit card or bank account will be charged.</p>
                <p className="text-[11px] text-slate-500">Test with Moneris dummy test cards:</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block">💳 Test Credit (Visa)</span>
                  <code className="text-slate-600 text-[11px]">4242 •••• •••• 4242</code>
                  <span className="block text-[10px] text-slate-400">Exp: 12/28 • CVV: 123</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block">💳 Test Credit (MC)</span>
                  <code className="text-slate-600 text-[11px]">5454 •••• •••• 5454</code>
                  <span className="block text-[10px] text-slate-400">Exp: 12/28 • CVV: 123</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block">💳 Test Visa Debit</span>
                  <code className="text-slate-600 text-[11px]">4500 •••• •••• 4500</code>
                  <span className="block text-[10px] text-slate-400">Exp: 12/28 • CVV: 123</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFinalize('qa_test_approved')}
                disabled={isFinalizing}
                className="w-full py-3.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#8EF705]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Submit Moneris QA Test Payment ($0.00)
              </button>
            </div>
          )}

          {/* Hosted Iframe Container */}
          <div
            id={MONERIS_DIV_ID}
            className={`transition-opacity duration-300 my-4 min-h-[320px] ${
              isFinalizing ? 'hidden' : 'block'
            }`}
          />

          {/* Compliance & Security Trust Badges */}
          <div className="pt-6 border-t border-slate-100 mt-6 grid grid-cols-2 gap-4 text-left text-slate-500 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Zero card data touches Pharsyde servers</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Direct Bank TLS 1.3 256-bit Encryption</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

