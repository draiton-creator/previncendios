/**
 * Componente de Integración Gmail y Contactos de Google
 * Permite importar contactos de la agenda y enviar boletines/alertas por correo oficial de Gmail.
 */

import React, { useState } from 'react';
import { Mail, Users, Send, CheckCircle2, AlertTriangle, RefreshCw, UserCheck, ShieldAlert } from 'lucide-react';
import {
  authenticateGoogleWorkspace,
  fetchGoogleContacts,
  sendGmailEmergencyNotice,
  GoogleContact,
} from '../../services/googleWorkspaceService';

export const GmailContactsIntegration: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [connectedUserEmail, setConnectedUserEmail] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);

  // Contactos
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(false);
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Formulario de Envío
  const [emailSubject, setEmailSubject] = useState<string>('🚨 ALERTA OFICIAL PREVINCENDIOS: Aviso de Emergencia Municipal');
  const [emailBody, setEmailBody] = useState<string>(
    'Estimado vecino/a:\n\nLe informamos de un aviso de emergencia activo en su municipio. Por favor, mantenga la calma, atienda a los canales oficiales y siga las recomendaciones de protección civil.\n\nPuesto de Mando y Coordinación Municipal\nPrevincendios España'
  );
  const [manualEmail, setManualEmail] = useState<string>('');

  // Confirmación y Estado de Envío
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentLog, setSentLog] = useState<Array<{ id: string; email: string; date: string; subject: string }>>([]);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  // Iniciar sesión con Google
  const handleGoogleConnect = async () => {
    setIsLoadingAuth(true);
    setContactsError(null);
    try {
      const { user, accessToken: token } = await authenticateGoogleWorkspace();
      setAccessToken(token);
      setConnectedUserEmail(user.email);
      // Cargar contactos automáticamente al conectar
      await loadContacts(token);
    } catch (err: any) {
      console.error(err);
      setContactsError(err.message || 'Error al conectar con Google Workspace');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Cargar contactos
  const loadContacts = async (tokenToUse?: string) => {
    setIsLoadingContacts(true);
    setContactsError(null);
    try {
      const fetched = await fetchGoogleContacts(tokenToUse || accessToken || undefined);
      setContacts(fetched);
      // Seleccionar todos por defecto
      setSelectedEmails(fetched.map((c) => c.email));
    } catch (err: any) {
      console.error(err);
      setContactsError(err.message || 'Error cargando contactos de Google');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const toggleSelectEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === contacts.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(contacts.map((c) => c.email));
    }
  };

  const handleAddManualEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEmail && manualEmail.includes('@') && !selectedEmails.includes(manualEmail)) {
      setSelectedEmails((prev) => [...prev, manualEmail]);
      setManualEmail('');
    }
  };

  // Abrir Modal de Confirmación
  const openConfirmSend = () => {
    if (selectedEmails.length === 0) {
      alert('Por favor selecciona al menos un destinatario o añade un correo.');
      return;
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Por favor completa el asunto y el mensaje del correo.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Ejecutar Envío por Gmail API
  const handleExecuteSend = async () => {
    setIsSending(true);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    let successCount = 0;
    const newLogs: Array<{ id: string; email: string; date: string; subject: string }> = [];

    try {
      for (const email of selectedEmails) {
        try {
          const res = await sendGmailEmergencyNotice(email, emailSubject, emailBody, accessToken || undefined);
          successCount++;
          newLogs.push({
            id: res.id || Math.random().toString(),
            email,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            subject: emailSubject,
          });
        } catch (singleErr) {
          console.error(`Error enviando a ${email}:`, singleErr);
        }
      }

      setSentLog((prev) => [...newLogs, ...prev]);
      setSendSuccessMessage(
        `¡Enviados con éxito ${successCount} de ${selectedEmails.length} correos de alerta mediante Gmail API!`
      );
      setIsConfirmModalOpen(false);
    } catch (globalErr: any) {
      setSendErrorMessage(globalErr.message || 'Error inesperado durante el envío masivo por Gmail.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Mail className="h-6 w-6" />
              <h2 className="text-xl font-black tracking-tight">Difusión de Alertas por Gmail y Contactos</h2>
            </div>
            <p className="mt-1 text-sm text-red-100">
              Conecte su cuenta de Google para sincronizar contactos de emergencia y emitir avisos oficiales directamente a sus ciudadanos y efectivos.
            </p>
          </div>

          {!accessToken ? (
            <button
              onClick={handleGoogleConnect}
              disabled={isLoadingAuth}
              className="inline-flex items-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-md hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoadingAuth ? 'Conectando...' : 'Conectar con Google'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3 rounded-xl bg-white/20 backdrop-blur px-4 py-2 text-sm text-white border border-white/30">
              <UserCheck className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="text-xs text-red-100">Cuenta Conectada</p>
                <p className="font-bold">{connectedUserEmail}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {sendSuccessMessage && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center space-x-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="font-medium text-sm">{sendSuccessMessage}</span>
        </div>
      )}

      {sendErrorMessage && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="font-medium text-sm">{sendErrorMessage}</span>
        </div>
      )}

      {/* Grid Principal: Contactos y Redacción */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Contactos de Google */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Google Contacts</h3>
            </div>
            {accessToken && (
              <button
                onClick={() => loadContacts()}
                disabled={isLoadingContacts}
                className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Recargar Contactos"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingContacts ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {!accessToken ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-semibold">Conecte su cuenta de Google para cargar sus contactos</p>
              <p className="text-xs text-gray-400 mt-1">
                Podrá seleccionar destinatarios directamente de su libreta oficial.
              </p>
            </div>
          ) : (
            <>
              {contactsError && (
                <div className="my-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {contactsError}
                </div>
              )}

              {/* Controles de Selección */}
              <div className="my-3 flex items-center justify-between text-xs">
                <button
                  onClick={handleSelectAll}
                  className="font-bold text-red-600 hover:underline dark:text-red-400"
                >
                  {selectedEmails.length === contacts.length ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
                <span className="text-gray-500 dark:text-gray-400">
                  {selectedEmails.length} seleccionados
                </span>
              </div>

              {/* Lista de Contactos Scrollable */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {contacts.length === 0 && !isLoadingContacts && (
                  <p className="text-xs text-gray-400 text-center py-8">No se encontraron contactos con email.</p>
                )}
                {contacts.map((c) => {
                  const isChecked = selectedEmails.includes(c.email);
                  return (
                    <label
                      key={c.resourceName}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isChecked
                          ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30'
                          : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectEmail(c.email)}
                          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{c.email}</p>
                        </div>
                      </div>
                      {c.phone && <span className="text-[10px] text-gray-400 hidden sm:inline">{c.phone}</span>}
                    </label>
                  );
                })}
              </div>

              {/* Añadir Email Manual */}
              <form onSubmit={handleAddManualEmail} className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <input
                  type="email"
                  placeholder="Añadir otro email manual..."
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-black dark:bg-gray-100 dark:text-gray-900"
                >
                  Añadir
                </button>
              </form>
            </>
          )}
        </div>

        {/* Columna Derecha: Redacción y Envío de Boletín por Gmail */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <Send className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Redactar Mensaje de Emergencia</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Asunto del Correo
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Contenido de la Notificación Oficial
                </label>
                <textarea
                  rows={7}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50 flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-300">
                <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <span>
                  Este correo se enviará a través de la API oficial de Gmail en nombre del usuario autenticado a{' '}
                  <strong>{selectedEmails.length} destinatario(s)</strong> seleccionados.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedEmails.length} Destinatario(s) marcados
            </span>

            <button
              onClick={openConfirmSend}
              disabled={!accessToken || selectedEmails.length === 0}
              className="inline-flex items-center space-x-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md hover:bg-red-700 transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Emitir por Gmail API</span>
            </button>
          </div>
        </div>
      </div>

      {/* Histórico de Envíos en la Sesión */}
      {sentLog.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Histórico de Correos Enviados</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Hora</th>
                  <th className="p-2.5">Destinatario</th>
                  <th className="p-2.5">Asunto</th>
                  <th className="p-2.5 rounded-r-lg">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sentLog.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-2.5 font-mono text-gray-500">{log.date}</td>
                    <td className="p-2.5 font-bold text-gray-900 dark:text-white">{log.email}</td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-300">{log.subject}</td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Enviado</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Envío por Gmail (Requisito Obligatorio Workspace) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Confirmar Envío de Correo Oficial</h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Está a punto de enviar una notificación oficial por correo electrónico utilizando la API de Gmail a{' '}
              <strong>{selectedEmails.length} destinatarios</strong>.
            </p>

            <div className="rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">Asunto: {emailSubject}</p>
              <p className="text-gray-500 dark:text-gray-400 truncate">Destinatarios: {selectedEmails.join(', ')}</p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSending}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteSend}
                disabled={isSending}
                className="inline-flex items-center space-x-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-black text-white hover:bg-red-700 shadow-md transition disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Enviando por Gmail...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Confirmar y Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
