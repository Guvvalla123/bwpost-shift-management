import React from "react";

const Footer = () => {
  const itemStyle =
    "px-2 py-1 rounded-md transition-all duration-200 cursor-pointer hover:bg-white/10 hover:text-white";

  return (
    <footer className="relative bg-blue-900 text-white border-t border-white/10">

      {/* TOP DIVIDER LINE */}
      <div className="absolute top-0 left-0 w-full h-px bg-white/20"></div>

      <div className="max-w-7xl mx-auto px-6 py-20">

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 text-sm">

          {/* PRODUCTS */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Products</h3>
            <ul className="space-y-2 text-blue-200">
              <li className={itemStyle}>Daily Mail</li>
              <li className={itemStyle}>Info Post</li>
              <li className={itemStyle}>Packages & Express</li>
              <li className={itemStyle}>Registered Mail + PZA</li>
              <li className={itemStyle}>Individual Labels & Stamps</li>
              <li className={itemStyle}>Printing & Shipping</li>
              <li className={itemStyle}>Prelabels</li>
              <li className={itemStyle}>Digital Shipping</li>
              <li className={itemStyle}>Courier Trips & Logistics</li>
              <li className={itemStyle}>Fulfillment Solutions</li>
            </ul>
          </div>

          {/* DIGITAL SHIPPING */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Digital Shipping</h3>
            <ul className="space-y-2 text-blue-200">
              <li className={itemStyle}>Printing & Shipping</li>
              <li className={itemStyle}>Digital Shipping</li>
              <li className={itemStyle}>Lettershop</li>
            </ul>
          </div>

          {/* SERVICES */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Services</h3>
            <ul className="space-y-2 text-blue-200">
              <li className={itemStyle}>Postage Optimization</li>
              <li className={itemStyle}>Forward Order</li>
              <li className={itemStyle}>Storage Order</li>
              <li className={itemStyle}>Mailbox Emptying</li>
              <li className={itemStyle}>Shipment Tracking</li>
              <li className={itemStyle}>Mailing Campaign Optimization</li>
              <li className={itemStyle}>Printing & Enveloping</li>
              <li className={itemStyle}>Order Inventory Material</li>
              <li className={itemStyle}>Get a Quote</li>
              <li className={itemStyle}>Order Prelabels</li>
              <li className={itemStyle}>Register Collection</li>
              <li className={itemStyle}>Downloads</li>
              <li className={itemStyle}>Common Questions</li>
              <li className={itemStyle}>Elections – Mail Solutions</li>
            </ul>
          </div>

          {/* JOBS */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Jobs</h3>
            <ul className="space-y-2 text-blue-200">
              <li className={itemStyle}>Become a Delivery Person</li>
              <li className={itemStyle}>Training</li>
              <li className={itemStyle}>Career at BWPOST</li>
            </ul>
          </div>

          {/* ABOUT */}
          <div>
            <h3 className="font-semibold mb-4 text-white">About Us</h3>
            <ul className="space-y-2 text-blue-200">
              <li className={itemStyle}>Press</li>
              <li className={itemStyle}>20 Years of BWPOST</li>
            </ul>
          </div>

          {/* MORE */}
          <div>
            <h3 className="font-semibold mb-4 text-white">More</h3>
            <ul className="space-y-2 text-blue-200">
              <li className={itemStyle}>Advantages</li>
              <li>
                <a
                  href="/#contact"
                  className={`${itemStyle} block`}
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-blue-300 text-sm">
          <div className="flex flex-wrap gap-6 mb-4 md:mb-0">
            <span className={itemStyle}>Imprint</span>
            <span className={itemStyle}>Terms & Conditions</span>
            <span className={itemStyle}>Accessibility</span>
            <span className={itemStyle}>Privacy Policy</span>
            <span className={itemStyle}>Privacy Settings</span>
          </div>

          <p>
            © {new Date().getFullYear()} BWPOST. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
