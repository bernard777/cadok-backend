/**
 * Service d'envoi d'emails
 * Mock basique pour les tests
 */

const emailService = {
  // Mock d'envoi d'email
  async sendEmail({ to, subject, html }) {
    console.log('📧 Email mock envoyé:', { to, subject });
    return { success: true, messageId: 'mock-' + Date.now() };
  },

  // Mock d'email de bienvenue
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Bienvenue sur Cadok',
      html: `<h1>Bienvenue ${user.pseudo}</h1>`
    });
  },

  // Mock d'email de notification
  async sendNotificationEmail(user, notification) {
    return this.sendEmail({
      to: user.email,
      subject: 'Notification Cadok',
      html: `<p>${notification.message}</p>`
    });
  }
};

module.exports = emailService;
