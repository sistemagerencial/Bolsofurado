import { useState } from "react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function Checkout() {
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);

  // CARTÃO
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cpf, setCpf] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // PIX
  const handlePix = async () => {
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("create-payment", {
      body: {
        user_id: user.id,
        plan: "monthly",
        payment_method: "pix",
        cpf,
      },
    });

    setLoading(false);

    if (error) return alert("Erro PIX");

    window.open(data.qr_code, "_blank");
  };

  // CARTÃO
  const handleCard = async () => {
    try {
      setLoading(true);

      const mp = new window.MercadoPago("SUA_PUBLIC_KEY");

      const token = await mp.createCardToken({
        cardNumber,
        cardholderName: cardName,
        cardExpirationMonth: cardExpMonth,
        cardExpirationYear: cardExpYear,
        securityCode: cardCvv,
        identificationType: "CPF",
        identificationNumber: cpf.replace(/\D/g, ""),
      });

      const { error } = await supabase.functions.invoke("create-payment", {
        body: {
          user_id: user.id,
          plan: "monthly",
          payment_method: "credit_card",
          token: token.id,
          payer: {
            email: user.email,
            cpf,
          },
        },
      });

      if (error) return alert("Erro pagamento");

      window.location.href = "/checkout/success";
    } catch (e) {
      console.error(e);
      window.location.href = "/checkout/error";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#16122A] p-6 rounded-2xl border border-white/10">
        <h1 className="text-xl text-white mb-6 text-center">
          Assinar Bolso Furado 🚀
        </h1>

        {/* TOGGLE */}
        <div className="flex bg-black/30 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMethod("pix")}
            className={`flex-1 py-2 rounded-lg ${method === "pix" ? "bg-purple-600" : ""}`}
          >
            PIX
          </button>

          <button
            onClick={() => setMethod("card")}
            className={`flex-1 py-2 rounded-lg ${method === "card" ? "bg-purple-600" : ""}`}
          >
            Cartão
          </button>
        </div>

        {/* PIX */}
        {method === "pix" && (
          <>
            <input
              placeholder="CPF"
              className="w-full mb-4 p-3 rounded bg-black/30"
              onChange={(e) => setCpf(e.target.value)}
            />

            <button
              onClick={handlePix}
              disabled={loading}
              className="w-full bg-green-500 py-3 rounded-lg"
            >
              {loading ? "Gerando..." : "Pagar com PIX"}
            </button>
          </>
        )}

        {/* CARTÃO */}
        {method === "card" && (
          <>
            <input
              placeholder="Número do cartão"
              onChange={(e) => setCardNumber(e.target.value)}
              className="input"
            />
            <input
              placeholder="Nome"
              onChange={(e) => setCardName(e.target.value)}
              className="input"
            />
            <input
              placeholder="Mês"
              onChange={(e) => setCardExpMonth(e.target.value)}
              className="input"
            />
            <input
              placeholder="Ano"
              onChange={(e) => setCardExpYear(e.target.value)}
              className="input"
            />
            <input
              placeholder="CVV"
              onChange={(e) => setCardCvv(e.target.value)}
              className="input"
            />
            <input
              placeholder="CPF"
              onChange={(e) => setCpf(e.target.value)}
              className="input"
            />

            <button
              onClick={handleCard}
              disabled={loading}
              className="w-full bg-purple-600 py-3 mt-4 rounded-lg"
            >
              {loading ? "Processando..." : "Pagar com Cartão"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
