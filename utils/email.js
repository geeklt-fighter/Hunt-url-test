const nodemailer = require('nodemailer')


/**
 * when user forgot their password, they send the email
 * @param {object} options - the content of the email 
 */
const sendEmail = async options => {
    // *1) create a transporter
    //     create reusable transporter object using the default SMTP transport
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    // *2) define the email option
    const mailOptions = {
        from: 'Tim Lo <a0987642936@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    // *3) actually send the email
    await transport.sendMail(mailOptions)
}

module.exports = sendEmail