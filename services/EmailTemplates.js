/**
 * SERVICE TEMPLATES EMAIL CADOK
 * =============================
 * 
 * Templates HTML modernes et responsifs pour tous les emails CADOK
 * Optimisés pour Courier.com et compatible Gmail SMTP
 */

class EmailTemplates {

  /**
   * Template Email de Vérification
   * ==============================
   */
  static getVerificationTemplate(userName, verificationCode, verificationUrl, userEmail) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérifiez votre compte CADOK</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
    
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header avec logo -->
        <div style="background: linear-gradient(135deg, #022601 0%, #2E7D32 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwMjI2MDEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMkU3RDMyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZGOEYwMCIvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGRkI3NEQiLz4KPC9saW5lYXJHcmFkaWVudD4KPHN0eWxlPi5zdmdLe2ZvbnQtZmFtaWx5OkFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjQ4cHg7Zm9udC13ZWlnaHQ6Ym9sZDtmaWxsOndoaXRlfTwvc3R5bGU+CjwvZGVmcz4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTQsNTQpIj4KPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjQ2IiBmaWxsPSJ1cmwoI2dyYWRpZW50MSkiLz4KPHRleHQgeD0iMCIgeT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJzdmdLIj5LPC90ZXh0Pgo8Y2lyY2xlIGN4PSIyNCIgY3k9Ii0yNCIgcj0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQyKSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjx0ZXh0IHg9IjI0IiB5PSItMTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjEycHgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+4oaUPC90ZXh0Pgo8L2c+Cjwvc3ZnPg==" alt="KADOC Logo" style="width: 60px; height: 60px;">
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                Bienvenue sur KADOC !
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                La plateforme de troc nouvelle génération
            </p>
        </div>

        <!-- Contenu principal -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 15px; font-size: 24px;">
                    🎉 Votre compte a été créé !
                </h2>
                <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.6;">
                    Salut <strong style="color: #022601;">${userName}</strong> ! <br>
                    Bienvenue dans la communauté KADOC. Pour commencer à échanger, 
                    il nous faut juste vérifier votre adresse email.
                </p>
            </div>

            <!-- Code de vérification stylé -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px dashed #2E7D32; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                <p style="color: #666; margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                    Votre code de vérification
                </p>
                <div style="background: white; border: 2px solid #2E7D32; border-radius: 8px; padding: 20px; display: inline-block; box-shadow: 0 2px 10px rgba(46,125,50,0.2);">
                    <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #022601; letter-spacing: 4px;">
                        ${verificationCode}
                    </span>
                </div>
                <p style="color: #999; margin: 15px 0 0; font-size: 12px;">
                    Ce code expire dans 10 minutes
                </p>
            </div>

            <!-- Bouton d'action -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); 
                          color: white; 
                          text-decoration: none; 
                          padding: 16px 40px; 
                          border-radius: 50px; 
                          font-weight: 600; 
                          font-size: 16px; 
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(46,125,50,0.4);">
                    ✅ Vérifier mon compte
                </a>
            </div>

            <!-- Instructions alternatives -->
            <div style="background: #f8f9fa; border-left: 4px solid #FF8F00; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
                <h4 style="color: #FF8F00; margin: 0 0 10px; font-size: 16px;">
                    💡 Autre méthode
                </h4>
                <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.5;">
                    Vous pouvez aussi copier ce lien dans votre navigateur :<br>
                    <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">
                        ${verificationUrl}
                    </code>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 30px 20px; color: #999; font-size: 14px;">
            <p style="margin: 0 0 10px;">
                Cet email a été envoyé à <strong>${userEmail}</strong>
            </p>
            <p style="margin: 0 0 20px;">
                Si vous n'avez pas créé de compte KADOC, vous pouvez ignorer cet email.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0 0 10px; font-weight: 600; color: #2E7D32;">
                    KADOC - Plateforme de Troc
                </p>
                <p style="margin: 0; font-size: 12px;">
                    🌍 Échangeons pour un monde plus durable
                </p>
            </div>
        </div>
    </div>
    
</body>
</html>`;
  }

  /**
   * Template Email Reset Mot de Passe
   * =================================
   */
  static getPasswordResetTemplate(userName, resetToken, resetUrl, userEmail) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialiser votre mot de passe CADOK</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
    
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header sécurité -->
        <div style="background: linear-gradient(135deg, #FF8F00 0%, #FFB74D 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <span style="font-size: 36px;">🔐</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                Réinitialisation sécurisée
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">
                Demande de changement de mot de passe
            </p>
        </div>

        <!-- Contenu principal -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 15px; font-size: 22px;">
                    Bonjour <span style="color: #2E7D32;">${userName}</span>
                </h2>
                <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.6;">
                    Nous avons reçu une demande de réinitialisation de votre mot de passe KADOC.
                    Si c'est bien vous, cliquez sur le bouton ci-dessous.
                </p>
            </div>

            <!-- Alert sécurité -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
                    <h4 style="color: #856404; margin: 0; font-size: 16px;">Sécurité importante</h4>
                </div>
                <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                    Si vous n'avez pas demandé cette réinitialisation, <strong>ignorez cet email</strong>. 
                    Votre mot de passe actuel reste inchangé et votre compte est sécurisé.
                </p>
            </div>

            <!-- Bouton de reset -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); 
                          color: white; 
                          text-decoration: none; 
                          padding: 16px 40px; 
                          border-radius: 50px; 
                          font-weight: 600; 
                          font-size: 16px; 
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(46,125,50,0.4);">
                    🔑 Réinitialiser mon mot de passe
                </a>
                <p style="color: #999; margin: 15px 0 0; font-size: 12px;">
                    Ce lien expire dans 1 heure
                </p>
            </div>

            <!-- Code de reset (alternative) -->
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h4 style="color: #333; margin: 0 0 15px; font-size: 14px; text-align: center;">
                    🔢 Code de vérification alternatif
                </h4>
                <div style="text-align: center;">
                    <code style="background: white; border: 2px solid #FF8F00; border-radius: 6px; padding: 12px 20px; font-size: 18px; font-weight: bold; color: #FF8F00; letter-spacing: 2px;">
                        ${resetToken}
                    </code>
                </div>
            </div>
        </div>

        <!-- Footer sécurité -->
        <div style="text-align: center; padding: 30px 20px; color: #999; font-size: 14px;">
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="color: #333; margin: 0 0 10px; font-size: 14px;">
                    🛡️ Votre sécurité avant tout
                </h4>
                <p style="margin: 0; font-size: 12px; line-height: 1.4;">
                    KADOC ne vous demandera jamais votre mot de passe par email. 
                    En cas de doute, contactez notre support.
                </p>
            </div>
            
            <p style="margin: 0 0 10px;">
                Email envoyé à <strong>${userEmail}</strong>
            </p>
            
            <div style="margin-top: 20px;">
                <a href="mailto:support@cadok.com" style="color: #2E7D32; text-decoration: none; font-weight: 600;">
                    📧 Contacter le support
                </a>
            </div>
        </div>
    </div>
    
</body>
</html>`;
  }

  /**
   * Template Email de Bienvenue
   * ===========================
   */
  static getWelcomeTemplate(userName, dashboardUrl, userEmail) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue dans CADOK !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
    
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header célébration -->
        <div style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 30px; font-weight: 600;">
                Compte vérifié avec succès !
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0; font-size: 16px;">
                Bienvenue dans la famille KADOC, ${userName} !
            </p>
        </div>

        <!-- Contenu principal -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            
            <!-- Message de bienvenue -->
            <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="color: #333; margin: 0 0 15px; font-size: 24px;">
                    🚀 Prêt à commencer l'aventure ?
                </h2>
                <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.6;">
                    Votre compte est maintenant actif ! Découvrez tout ce que KADOC peut vous offrir 
                    pour échanger, partager et construire une communauté plus durable.
                </p>
            </div>

            <!-- Étapes suivantes -->
            <div style="margin: 30px 0;">
                <h3 style="color: #333; margin: 0 0 25px; font-size: 20px; text-align: center;">
                    📋 Vos prochaines étapes
                </h3>
                
                <div style="margin: 0;">
                    <!-- Étape 1 -->
                    <div style="display: flex; align-items: flex-start; margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #2E7D32;">
                        <div style="background: #2E7D32; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
                        <div>
                            <h4 style="color: #333; margin: 0 0 5px; font-size: 16px;">Complétez votre profil</h4>
                            <p style="color: #666; margin: 0; font-size: 14px;">Ajoutez une photo et quelques infos pour inspirer confiance</p>
                        </div>
                    </div>

                    <!-- Étape 2 -->
                    <div style="display: flex; align-items: flex-start; margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #4CAF50;">
                        <div style="background: #4CAF50; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
                        <div>
                            <h4 style="color: #333; margin: 0 0 5px; font-size: 16px;">Publiez votre premier objet</h4>
                            <p style="color: #666; margin: 0; font-size: 14px;">Partagez quelque chose que vous n'utilisez plus</p>
                        </div>
                    </div>

                    <!-- Étape 3 -->
                    <div style="display: flex; align-items: flex-start; margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #FF8F00;">
                        <div style="background: #FF8F00; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</div>
                        <div>
                            <h4 style="color: #333; margin: 0 0 5px; font-size: 16px;">Explorez la communauté</h4>
                            <p style="color: #666; margin: 0; font-size: 14px;">Découvrez les objets disponibles près de chez vous</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bouton d'action principal -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${dashboardUrl}" 
                   style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); 
                          color: white; 
                          text-decoration: none; 
                          padding: 18px 50px; 
                          border-radius: 50px; 
                          font-weight: 600; 
                          font-size: 18px; 
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(46,125,50,0.4);">
                    🏠 Accéder à mon tableau de bord
                </a>
            </div>
        </div>

        <!-- Footer social -->
        <div style="text-align: center; padding: 30px 20px; color: #999; font-size: 14px;">
            <h4 style="color: #333; margin: 0 0 15px; font-size: 16px;">
                🌟 Rejoignez notre communauté
            </h4>
            
            <p style="margin: 20px 0 10px;">
                Des questions ? Notre équipe est là pour vous aider !
            </p>
            
            <div style="margin: 20px 0;">
                <a href="mailto:support@cadok.com" style="color: #2E7D32; text-decoration: none; margin: 0 15px;">📧 Support</a>
                <a href="#" style="color: #2E7D32; text-decoration: none; margin: 0 15px;">💬 Chat</a>
                <a href="#" style="color: #2E7D32; text-decoration: none; margin: 0 15px;">📞 Aide</a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 12px;">
                <p style="margin: 0; color: #2E7D32; font-weight: 600;">
                    KADOC - Plateforme de Troc
                </p>
                <p style="margin: 5px 0 0; color: #999;">
                    🌍 Ensemble, construisons un monde plus durable
                </p>
            </div>
        </div>
    </div>
    
</body>
</html>`;
  }

  /**
   * Template Simple (pour notifications)
   * ====================================
   */
  static getSimpleTemplate(title, message, buttonText = null, buttonUrl = null) {
    const button = buttonText && buttonUrl ? 
      `<div style="text-align: center; margin: 30px 0;">
          <a href="${buttonUrl}" 
             style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); 
                    color: white; 
                    text-decoration: none; 
                    padding: 14px 30px; 
                    border-radius: 50px; 
                    font-weight: 600; 
                    font-size: 16px; 
                    display: inline-block;
                    box-shadow: 0 4px 15px rgba(46,125,50,0.4);">
              ${buttonText}
          </a>
      </div>` : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
    
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header simple -->
        <div style="background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%); padding: 30px 20px; text-align: center;">
            <div style="background: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgdmlld0JveD0iMCAwIDEwOCAxMDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwMjI2MDEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMkU3RDMyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZGOEYwMCIvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGRkI3NEQiLz4KPC9saW5lYXJHcmFkaWVudD4KPHN0eWxlPi5zdmdLe2ZvbnQtZmFtaWx5OkFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjQ4cHg7Zm9udC13ZWlnaHQ6Ym9sZDtmaWxsOndoaXRlfTwvc3R5bGU+CjwvZGVmcz4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTQsNTQpIj4KPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjQ2IiBmaWxsPSJ1cmwoI2dyYWRpZW50MSkiLz4KPHRleHQgeD0iMCIgeT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJzdmdLIj5LPC90ZXh0Pgo8Y2lyY2xlIGN4PSIyNCIgY3k9Ii0yNCIgcj0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQyKSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjx0ZXh0IHg9IjI0IiB5PSItMTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjEycHgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+4oaUPC90ZXh0Pgo8L2c+Cjwvc3ZnPg==" alt="KADOC Logo" style="width: 40px; height: 40px;">
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                ${title}
            </h1>
        </div>

        <!-- Contenu -->
        <div style="padding: 40px 30px;">
            <div style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
                ${message}
            </div>
            
            ${button}
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #2E7D32; font-weight: 600;">KADOC</p>
            <p style="margin: 5px 0 0;">🌍 Plateforme de troc responsable</p>
        </div>
    </div>
    
</body>
</html>`;
  }

  /**
   * Version texte simple (fallback)
   * ===============================
   */
  static getVerificationTextTemplate(userName, verificationCode, verificationUrl) {
    return `
KADOC - Vérification de votre compte
====================================

Bonjour ${userName},

Bienvenue sur KADOC ! Pour activer votre compte, utilisez le code de vérification ci-dessous :

CODE DE VÉRIFICATION : ${verificationCode}

Ou cliquez sur ce lien : ${verificationUrl}

Ce code expire dans 10 minutes.

Si vous n'avez pas créé de compte KADOC, ignorez cet email.

---
KADOC - Plateforme de Troc
🌍 Échangeons pour un monde plus durable
    `;
  }

  static getPasswordResetTextTemplate(userName, resetToken, resetUrl) {
    return `
KADOC - Réinitialisation de mot de passe
========================================

Bonjour ${userName},

Nous avons reçu une demande de réinitialisation de votre mot de passe.

Pour continuer, cliquez sur ce lien : ${resetUrl}

Ou utilisez ce code : ${resetToken}

Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

---
KADOC - Sécurité avant tout
📧 support@cadok.com
    `;
  }
}

module.exports = EmailTemplates;
