import React, { useState } from 'react';
import { db } from '../lib/db';
import { Mail, Phone, Lock, ArrowRight, Loader2, X, ShieldCheck } from 'lucide-react';

export default function ForgotPassword({ onCancel, lang = "en" }: { onCancel: () => void; lang?: "en" | "sw" }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleInitiate = async () => {
    setError('');
    setLoading(true);
    const res = await db.initiateRecovery(email);
    setLoading(false);
    if (res.success && res.maskedPhone) {
      setMaskedPhone(res.maskedPhone);
      setName(res.name);
      setCustomerId(res.customerId);
      setStep(2);
    } else {
      setError(
        lang === "sw"
          ? "Akaunti haikupatikana. Tafadhali wasiliana na huduma kwa wateja: +255764258114"
          : "Account not found. Please contact support: +255764258114"
      );
    }
  };

  const handleVerify = async () => {
    setError('');
    if (!phone.trim()) {
      setError(lang === "sw" ? "Tafadhali weka namba ya simu." : "Please enter your phone number.");
      return;
    }
    setLoading(true);
    const res = await db.verifyRecovery(customerId, phone);
    setLoading(false);
    if (res.success) {
      if (res.requiresOtp) {
        setStep(2.5); // Go to OTP verification step
      } else if (res.token) {
        setToken(res.token);
        setStep(3); // Direct transition fallback
      }
    } else {
      setError(
        lang === "sw"
          ? "Namba ya simu siyo sahihi. Tafadhali wasiliana na huduma kwa wateja: +255764258114"
          : "Incorrect phone number. Please contact support: +255764258114"
      );
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp.trim() || otp.trim().length !== 6) {
      setError(
        lang === "sw"
          ? "Tafadhali weka namba sahihi ya OTP yenye tarakimu 6."
          : "Please enter a valid 6-digit OTP code."
      );
      return;
    }
    setLoading(true);
    const res = await (db as any).verifyOtp(customerId, otp.trim());
    setLoading(false);
    if (res.success && res.token) {
      setToken(res.token);
      setStep(3);
    } else {
      setError(
        res.error ||
          (lang === "sw"
            ? "Namba ya OTP siyo sahihi au imekwisha muda wake."
            : "Incorrect or expired OTP code.")
      );
    }
  };

  const handleReset = async () => {
    setError('');
    const reqLength = password.length >= 6;
    const reqUpper = /[A-Z]/.test(password);
    const reqLower = /[a-z]/.test(password);
    const reqDigit = /[0-9]/.test(password);

    if (!reqLength || !reqUpper || !reqLower || !reqDigit) {
      setError(
        lang === "sw"
          ? "Nenosiri jipya lazima liwe na herufi 6+, herufi kubwa, herufi ndogo na nambari."
          : "New password must have 6+ chars, uppercase, lowercase, and digit."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(lang === "sw" ? "Nenosiri jipya na uthibitisho havilingani." : "Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await db.resetPassword(customerId, token, password);
    setLoading(false);
    if (res.success) {
      alert(
        lang === "sw"
          ? "Nenosiri limerekebishwa kwa mafanikio! Tafadhali ingia."
          : "Password updated successfully! Please login."
      );
      onCancel();
    } else {
      setError(
        lang === "sw"
          ? "Imeshindwa kusasisha nenosiri. Tafadhali wasiliana na huduma."
          : "Failed to update password. Please contact support."
      );
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full mx-auto relative animate-in fade-in duration-200">
      <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
        <X size={20} />
      </button>
      
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {step === 1 && (lang === "sw" ? "Rejesha Akaunti" : "Account Recovery")}
        {step === 2 && (lang === "sw" ? "Hakiki Utambulisho" : "Verify Identity")}
        {step === 2.5 && (lang === "sw" ? "Hakiki Namba ya OTP" : "Uhakiki wa OTP")}
        {step === 3 && (lang === "sw" ? "Weka Nenosiri Jipya" : "Reset Password")}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4 font-semibold border border-red-100">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10 backdrop-blur-[1px]">
          <Loader2 className="animate-spin text-orange-600" size={40} />
        </div>
      )}
      
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-2">
            {lang === "sw"
              ? "Weka barua pepe iliyosajiliwa kwenye akaunti yako ili kuanza."
              : "Enter the email address registered to your account to begin."}
          </p>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-xs font-semibold focus:bg-white"
            />
          </div>
          <button onClick={handleInitiate} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl font-bold transition flex items-center justify-center cursor-pointer text-xs">
            {lang === "sw" ? "Endelea" : "Continue"} <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
            <p className="text-xs text-gray-500">
              {lang === "sw" ? "Jina la Akaunti:" : "Account Name:"}{" "}
              <strong className="text-gray-900 font-bold">{name}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {lang === "sw" ? "Simu ya Marejesho:" : "Registered Phone:"}{" "}
              <strong className="text-gray-900 font-bold">{maskedPhone}</strong>
            </p>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            {lang === "sw"
              ? "Tafadhali weka namba yako yote ya simu iliyosajiliwa."
              : "Please enter the full registered phone number."}
          </p>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="+255..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-xs font-semibold"
            />
          </div>
          <button onClick={handleVerify} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl font-bold transition cursor-pointer text-xs">
            {lang === "sw" ? "Tuma Uhakiki wa OTP" : "Request Verification"}
          </button>
        </div>
      )}

      {step === 2.5 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
            {lang === "sw"
              ? `Namba ya siri ya OTP imetumwa kwa SMS kwenda namba yako ya simu: ${phone}. Tafadhali iweke hapa chini.`
              : `A 6-digit OTP passcode was sent to your phone ${phone}. Please enter it below.`}
          </p>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 tracking-[0.25em] font-mono text-center text-sm font-bold placeholder:tracking-normal"
            />
          </div>
          <button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold transition cursor-pointer text-xs">
            {lang === "sw" ? "Thibitisha Namba ya OTP" : "Verify OTP Code"}
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl font-semibold transition text-[11px]"
          >
            {lang === "sw" ? "Tuma tena OTP (Resend)" : "Resend OTP Code"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 mb-2">
            {lang === "sw" ? "Unda nenosiri jipya na salama chini:" : "Create your new secure password below:"}
          </p>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder={lang === "sw" ? "Nenosiri Jipya" : "New Password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-xs font-semibold"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder={lang === "sw" ? "Thibitisha Nenosiri" : "Confirm Password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 text-xs font-semibold"
            />
          </div>
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-1 text-left text-slate-600">
            <p className="font-bold">{lang === "sw" ? "Vigezo vya Nenosiri:" : "Password Criteria:"}</p>
            <p className={password.length >= 6 ? "text-emerald-700 font-bold" : ""}>✓ {lang === "sw" ? "Herufi 6 au zaidi" : "6+ characters"}</p>
            <p className={/[A-Z]/.test(password) ? "text-emerald-700 font-bold" : ""}>✓ {lang === "sw" ? "Herufi kubwa" : "Uppercase letter"}</p>
            <p className={/[a-z]/.test(password) ? "text-emerald-700 font-bold" : ""}>✓ {lang === "sw" ? "Herufi ndogo" : "Lowercase letter"}</p>
            <p className={/[0-9]/.test(password) ? "text-emerald-700 font-bold" : ""}>✓ {lang === "sw" ? "Nambari (0-9)" : "Number (0-9)"}</p>
          </div>

          <button onClick={handleReset} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl font-bold transition cursor-pointer text-xs">
            {lang === "sw" ? "Hifadhi Nenosiri Jipya" : "Update Password"}
          </button>
        </div>
      )}
    </div>
  );
}
