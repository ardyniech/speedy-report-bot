import { useEffect, useRef, useState } from "react";
import { Settings, Upload, X } from "lucide-react";
import { DEFAULT_SCHOOL, loadSchool, saveSchool, type SchoolSettings } from "@/lib/school";
import { toast } from "sonner";

export function SchoolSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setData(loadSchool());
  }, [open]);

  const set = <K extends keyof SchoolSettings>(k: K, v: SchoolSettings[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const onLogo = (file: File) => {
    if (file.size > 1024 * 1024) {
      toast.error("Logo maksimal 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logoDataUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const onSave = () => {
    saveSchool(data);
    toast.success("Pengaturan sekolah disimpan");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-border hover:bg-muted"
        aria-label="Pengaturan sekolah"
      >
        <Settings className="h-3.5 w-3.5" /> Pengaturan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl ring-1 ring-border sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Pengaturan Sekolah</h3>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Data ini muncul di kop & tanda tangan PDF laporan.
            </p>

            <div className="space-y-3">
              <Field label="Nama Sekolah" value={data.name} onChange={(v) => set("name", v)} />
              <Field label="Alamat" value={data.address} onChange={(v) => set("address", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telepon" value={data.phone} onChange={(v) => set("phone", v)} />
                <Field label="Kota" value={data.city} onChange={(v) => set("city", v)} />
              </div>
              <Field label="Nama Guru Kelas" value={data.teacherName} onChange={(v) => set("teacherName", v)} />
              <Field label="Nama Kepala Sekolah" value={data.principalName} onChange={(v) => set("principalName", v)} />

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Logo Sekolah</label>
                <div className="flex items-center gap-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                    {data.logoDataUrl ? (
                      <img src={data.logoDataUrl} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No logo</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload (max 1MB)
                    </button>
                    {data.logoDataUrl && (
                      <button
                        onClick={() => set("logoDataUrl", "")}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Hapus logo
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onLogo(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/70"
              >
                Batal
              </button>
              <button
                onClick={onSave}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
