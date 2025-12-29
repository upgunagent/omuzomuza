"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResumeDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Trash, Upload, Download } from "lucide-react";

export default function CandidateFilesPage() {
    const [files, setFiles] = useState<ResumeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { fetchFiles(); }, []);

    async function fetchFiles() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('resume_documents').select('*').eq('candidate_id', user.id);
            setFiles(data || []);
        }
        setLoading(false);
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

            const { data: dbData, error: dbError } = await supabase.from('resume_documents').insert({
                candidate_id: user.id,
                file_name: file.name,
                file_url: urlData.publicUrl
            }).select().single();

            if (dbError) throw dbError;
            if (dbData) setFiles([...files, dbData]);

        } catch (error) {
            console.error(error);
            alert('Dosya yükleme hatası');
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Bu dosyayı silmek istediğinizden emin misiniz?")) return;
        const { error } = await supabase.from('resume_documents').delete().eq('id', id);
        if (!error) setFiles(files.filter(f => f.id !== id));
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dosyalarım</h1>
                    <p className="text-slate-500">Sertifikalar, portfolyolar gibi belgelerinizi yükleyin.</p>
                </div>
                <div className="relative">
                    <input type="file" id="file-upload" className="hidden" onChange={handleUpload} disabled={uploading} />
                    <Button asChild disabled={uploading}>
                        <label htmlFor="file-upload" className="cursor-pointer flex items-center">
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Dosya Yükle
                        </label>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map(file => (
                    <Card key={file.id}>
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold truncate w-full max-w-[200px]" title={file.file_name}>{file.file_name}</p>
                                <a href={file.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center justify-center gap-1 mt-1">
                                    <Download className="w-3 h-3" /> İndir
                                </a>
                            </div>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full" onClick={() => handleDelete(file.id!)}>
                                <Trash className="w-4 h-4 mr-2" /> Sil
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {files.length === 0 && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                        Henüz dosya yüklenmedi.
                    </div>
                )}
            </div>
        </div>
    );
}
