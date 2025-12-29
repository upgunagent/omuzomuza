"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);

        if (password.length < 6) {
            setMessage({ type: 'error', text: "Şifre en az 6 karakter olmalıdır." });
            return;
        }

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: "Şifreler eşleşmiyor." });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) throw error;

            setMessage({ type: 'success', text: "Şifreniz başarıyla güncellendi." });
            setPassword("");
            setConfirmPassword("");
            setTimeout(() => {
                onClose();
                setMessage(null);
            }, 2000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Şifre değiştirme hatası." });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Şifre Değiştir">
            <form onSubmit={handlePasswordChange} className="space-y-4">
                {message && (
                    <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Yeni Şifre</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="password"
                            className="pl-9"
                            placeholder="******"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Yeni Şifre (Tekrar)</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="password"
                            className="pl-9"
                            placeholder="******"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={loading} className="bg-[#7e22ce] hover:bg-[#6b21a8] text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Güncelle"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
