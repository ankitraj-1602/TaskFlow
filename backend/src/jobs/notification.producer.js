const { notificationQueue } = require('../config/queues');

class NotificationProducer {
  static async queueNotification(data) {
    return notificationQueue.add('send', data);
  }
}

module.exports = NotificationProducer;