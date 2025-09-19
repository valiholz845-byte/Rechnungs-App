# Gmail SMTP Integration Setup

Um automatische E-Mail-Versendung für Rechnungen zu aktivieren, müssen Sie Gmail SMTP konfigurieren.

## Schritt 1: Gmail App-Passwort erstellen

1. **Gehen Sie zu Ihrem Google-Konto**: 
   - Öffnen Sie [myaccount.google.com](https://myaccount.google.com)
   - Melden Sie sich mit Ihrem Gmail-Konto an

2. **Aktivieren Sie die 2-Faktor-Authentifizierung**:
   - Gehen Sie zu "Sicherheit" → "2-Schritt-Bestätigung"
   - Aktivieren Sie die 2-Schritt-Bestätigung falls noch nicht aktiviert

3. **App-Passwort erstellen**:
   - Gehen Sie zu "Sicherheit" → "App-Passwörter"
   - Wählen Sie "App auswählen" → "Andere (benutzerdefinierter Name)"
   - Geben Sie "RechnungsManager" ein
   - Klicken Sie auf "Generieren"
   - **Notieren Sie sich das 16-stellige App-Passwort** (z.B. `abcd efgh ijkl mnop`)

## Schritt 2: Umgebungsvariablen konfigurieren

Bearbeiten Sie die Datei `/app/backend/.env` und fügen Sie Ihre Gmail-Daten hinzu:

```env
# Gmail SMTP Configuration
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="ihre.email@gmail.com"
SMTP_PASSWORD="abcd efgh ijkl mnop"
SENDER_EMAIL="ihre.email@gmail.com" 
SENDER_NAME="Ihr Firmenname"
```

**Wichtig**: 
- Verwenden Sie das **App-Passwort**, nicht Ihr normales Gmail-Passwort
- Das App-Passwort hat keine Leerzeichen in der .env-Datei

## Schritt 3: Backend neu starten

```bash
sudo supervisorctl restart backend
```

## Schritt 4: Testen

1. Erstellen Sie eine neue Rechnung über die Benutzeroberfläche
2. Die Rechnung wird automatisch als PDF per E-Mail an den Kunden gesendet
3. Überprüfen Sie die Backend-Logs: `tail -f /var/log/supervisor/backend.*.log`

## Funktionen nach der Konfiguration

- ✅ **Automatischer E-Mail-Versand** bei Rechnungserstellung
- ✅ **Professionelle deutsche E-Mail-Vorlage**
- ✅ **PDF-Rechnung als Anhang**
- ✅ **Rechnungsstatus-Update** auf "Versendet"
- ✅ **Manueller E-Mail-Versand** über die Benutzeroberfläche

## Fehlerbehebung

**Problem**: "Email service not configured"
- **Lösung**: Überprüfen Sie, ob SMTP_USERNAME und SMTP_PASSWORD in der .env-Datei gesetzt sind

**Problem**: "SMTP authentication failed"
- **Lösung**: Überprüfen Sie das App-Passwort und die E-Mail-Adresse

**Problem**: E-Mails werden nicht gesendet
- **Lösung**: Überprüfen Sie die Backend-Logs auf Fehler: `tail -f /var/log/supervisor/backend.*.log`

## Sicherheitshinweise

- Teilen Sie Ihr App-Passwort niemals mit anderen
- Das App-Passwort funktioniert nur mit aktivierter 2-Faktor-Authentifizierung
- Sie können das App-Passwort jederzeit über Ihr Google-Konto widerrufen

## Support

Bei Problemen mit der Gmail-Integration wenden Sie sich an den Support oder überprüfen Sie die Backend-Logs für detaillierte Fehlermeldungen.