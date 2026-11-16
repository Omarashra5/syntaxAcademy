import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Certificate } from '../../types';

interface CertificatePreviewProps {
  certificate: Pick<
    Certificate,
    'certificateId' | 'studentFullName' | 'trackName' | 'instructorName' | 'completionDate' | 'grade' | 'status'
  >;
}

/**
 * Live English-only Landscape A4 Certificate Preview
 * Always renders in English & LTR regardless of active site language.
 */
export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ certificate }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://syntaxacademy.edu';
    const verifyUrl = `${origin}/verify-certificate/${encodeURIComponent(
      certificate.certificateId || 'PREVIEW'
    )}`;
    QRCode.toDataURL(verifyUrl, {
      width: 180,
      margin: 1,
      color: { dark: '#0F172A', light: '#FAFAFC' },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [certificate.certificateId]);

  return (
    <div
      dir="ltr"
      lang="en"
      className="relative w-full aspect-[297/210] rounded-xl bg-[#0A0F22] p-3 sm:p-5 shadow-2xl overflow-hidden select-none text-left"
    >
      {/* Subtle violet outer frame */}
      <div className="w-full h-full border border-violet-500/60 p-1.5 sm:p-2.5 bg-[#0A0F22]">
        <div className="relative w-full h-full bg-[#FAFAFC] text-slate-900 p-4 sm:p-8 flex flex-col justify-between border-2 border-[#C4A252]">
          {/* Revoked watermark banner ONLY when revoked */}
          {certificate.status === 'revoked' && (
            <div className="absolute inset-0 bg-rose-950/20 flex items-center justify-center pointer-events-none z-20">
              <div className="border-4 border-rose-600 text-rose-700 bg-white/95 px-6 py-2 text-xl sm:text-3xl font-bold tracking-widest uppercase -rotate-12">
                REVOKED CERTIFICATE
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center">
            <div className="inline-block bg-slate-900 text-white px-4 sm:px-6 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-bold tracking-[0.22em]">
              SYNTAX ACADEMY
            </div>
            <h2 className="mt-2 sm:mt-3 font-serif text-base sm:text-2xl md:text-3xl font-bold tracking-wide text-slate-900">
              CERTIFICATE OF COMPLETION
            </h2>
            <div className="w-24 sm:w-36 h-0.5 bg-[#C4A252] mx-auto mt-1.5 sm:mt-2" />
          </div>

          {/* Recipient & Program */}
          <div className="text-center px-2 sm:px-6 my-auto">
            <p className="text-[10px] sm:text-sm text-slate-600">
              This certificate is proudly presented to
            </p>
            <p className="mt-1 sm:mt-2 font-serif text-lg sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight break-words">
              {certificate.studentFullName || 'Student Full Name'}
            </p>
            <div className="w-40 sm:w-72 h-px bg-slate-300 mx-auto mt-1.5 sm:mt-2.5" />
            <p className="mt-2 sm:mt-3 text-[10px] sm:text-sm text-slate-600">
              For successfully completing the
            </p>
            <p className="mt-0.5 sm:mt-1 text-sm sm:text-xl md:text-2xl font-bold text-violet-700">
              {certificate.trackName || 'Learning Track'}
            </p>
            {certificate.grade && (
              <p className="mt-1 text-[10px] sm:text-xs font-semibold text-slate-800">
                Achievement: {certificate.grade}
              </p>
            )}
            <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-xs text-slate-500 max-w-xl mx-auto hidden sm:block">
              In recognition of dedication, commitment, and successful completion of the learning program.
            </p>
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-3 items-end gap-2 pt-2 border-t border-slate-200/80">
            <div className="text-left">
              <div className="text-[8px] sm:text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Instructor
              </div>
              <div className="text-[10px] sm:text-sm font-bold text-slate-900 truncate">
                {certificate.instructorName || 'Instructor Name'}
              </div>
              <div className="mt-1 text-[8px] sm:text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Date of Completion
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-800 font-mono-tabular">
                {certificate.completionDate || '2026-11-16'}
              </div>
            </div>

            <div className="text-center">
              <div className="font-serif italic text-xs sm:text-base text-slate-900">
                Syntax Academy Board
              </div>
              <div className="w-24 sm:w-36 h-px bg-slate-800 mx-auto my-0.5 sm:my-1" />
              <div className="text-[8px] sm:text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Authorized Signature
              </div>
              <div className="text-[8px] sm:text-[10px] text-slate-600 font-mono-tabular mt-0.5 truncate">
                ID: {certificate.certificateId || 'SYN-2026-0001'}
              </div>
            </div>

            <div className="flex flex-col items-end">
              {qrUrl && (
                <img
                  src={qrUrl}
                  alt="Certificate Verification QR Code"
                  className="w-10 h-10 sm:w-16 sm:h-16 border border-slate-200 rounded bg-white"
                />
              )}
              <span className="text-[7px] sm:text-[9px] text-slate-500 font-semibold tracking-wider mt-0.5">
                SCAN TO VERIFY
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
