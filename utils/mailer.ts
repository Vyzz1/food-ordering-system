import * as nodemailer from "nodemailer";
import * as fs from "fs";
import * as handlebars from "handlebars";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAILER_TO,
    pass: process.env.MAILER_PASSWORD,
  },
});

handlebars.registerHelper("formatDate", function (date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

handlebars.registerHelper("formatPrice", function (price) {
  if (price === undefined || price === null) return "0";

  let numericPrice;
  if (typeof price === "string") {
    numericPrice = parseFloat(price.replace(/[^0-9.-]+/g, ""));
  } else if (typeof price === "number") {
    numericPrice = price;
  } else {
    numericPrice = 0;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numericPrice);
});

handlebars.registerHelper("toLowerCase", function (str) {
  return str.toLowerCase();
});

const compileTemplate = async (
  templateName: string,
  data: Record<string, any>
) => {
  const filePath = path.resolve(
    __dirname,
    "../templates",
    `${templateName}.handlebars`
  );
  const html = await fs.promises.readFile(filePath, "utf-8");
  const template = handlebars.compile(html);
  return template(data);
};

const sendMail = async (
  to: string,
  subject: string,
  template: string,
  data: Record<string, any>
) => {
  try {
    const htmlContent = await compileTemplate(template, data);

    const mailOptions = {
      from: process.env.MAILER_TO,
      to,
      subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email sent: ", result.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};

// const sendOrderConfirmationEmail = async (orderId: string, to: string) => {
//   const subject = "Order Confirmation";
//   const template = "order-confirmation";

//   const order = await orderService.getOrderById(orderId);
//   const data = {
//     ...order,
//   };

//   await sendMail(to, subject, template, data);
// };

export default {
  sendMail,
};
