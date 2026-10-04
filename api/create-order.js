export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      name,
      phone,
      email,
      tickets
    } = req.body || {};

    const count = Number(tickets);

    // Validate customer details
    if (!name || !phone || !email) {
      return res.status(400).json({
        error: "Name, phone and email are required."
      });
    }

    // Validate ticket count
    if (![1, 2, 3, 4].includes(count)) {
      return res.status(400).json({
        error: "Invalid ticket quantity."
      });
    }

    /*
      TEMPORARY TEST PRICE
      1 ticket = ₹1
      2 tickets = ₹2
      3 tickets = ₹3
      4 tickets = ₹4

      After the test works, change 1 to 2000.
    */
    const amount = count * 1 * 100;

    // Make sure Razorpay credentials exist
    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        error: "Razorpay credentials are not configured."
      });
    }

    // Create Basic Auth credentials
    const auth = Buffer
      .from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      )
      .toString("base64");

    // Create Razorpay order
    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },

        body: JSON.stringify({
          amount: amount,
          currency: "INR",
          receipt: `HH-${Date.now()}`,

          notes: {
            name: name,
            phone: phone,
            email: email,
            tickets: String(count)
          }
        })
      }
    );

    const razorpayData =
      await razorpayResponse.json();

    // Razorpay returned an error
    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay order error:",
        razorpayData
      );

      return res.status(razorpayResponse.status).json({
        error:
          razorpayData?.error?.description ||
          "Razorpay could not create the order."
      });
    }

    // Make absolutely sure an order ID exists
    if (!razorpayData.id) {
      console.error(
        "Razorpay response missing order ID:",
        razorpayData
      );

      return res.status(500).json({
        error: "Razorpay order was not created."
      });
    }

    // Send order information to frontend
    return res.status(200).json({
      id: razorpayData.id,
      amount: razorpayData.amount,
      currency: razorpayData.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Unable to create Razorpay order."
    });
  }
}
