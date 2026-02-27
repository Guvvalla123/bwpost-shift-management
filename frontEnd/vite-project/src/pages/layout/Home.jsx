import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      <Header />

      <main className="flex-1 pt-16">

        {/* ================= HERO ================= */}
        <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white overflow-hidden">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_45%)]"></div>

          <div className="relative max-w-7xl mx-auto px-6 min-h-[80vh] grid md:grid-cols-2 gap-20 items-center">

            {/* LEFT */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
                Arrives.
              </h1>

              <p className="text-xl text-blue-100 mb-10 max-w-lg leading-relaxed">
                90 million shipments a year all over the world.
              </p>

              <div className="flex gap-5">
                <button className="px-7 py-3 bg-white text-blue-700 font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition duration-300">
                  Our Advantages
                </button>

                <button className="px-7 py-3 border border-white/40 rounded-lg hover:bg-white/10 transition duration-300">
                  Learn More
                </button>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <div className="absolute -inset-8 bg-white/10 blur-3xl rounded-3xl"></div>

              <img
                src="/bwpost_wn_kampagne_7113_berab.jpg"
                alt="BWPOST Campaign"
                className="relative rounded-3xl shadow-2xl w-full object-cover"
              />
            </div>

          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="bg-gray-50 py-28">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">

            {[
              { value: "3,600+", label: "Business Customers" },
              { value: "90M+", label: "Shipments Per Year" },
              { value: "20+", label: "Years in the Market" },
            ].map((stat, index) => (
              <div key={index}>
                <h2 className="text-4xl font-bold text-blue-700 tracking-tight">
                  {stat.value}
                </h2>
                <p className="mt-4 text-gray-600 text-base">{stat.label}</p>
              </div>
            ))}

          </div>
        </section>

        {/* ================= NEWS + CONTACT ================= */}
        <section id="contact" className="bg-white py-28">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-16">

            {/* NEWS */}
            <div className="lg:col-span-2 space-y-12">

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-600 font-semibold uppercase tracking-wider text-sm">
                    Latest Updates
                  </p>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight mt-2">
                    News
                  </h2>
                </div>

                <button className="text-blue-600 font-medium hover:text-blue-800 transition">
                  News Archive →
                </button>
              </div>

              {[{
                img: "/azubis-gesucht.png",
                title: "Trainees wanted - Office management clerk (m/f/d)",
                desc: "Your playing field: Office & Logistics. Your training: organization & teamwork."
              },
              {
                img: "/jubilogo_final_pfade.png",
                title: "20 Years of BWPOST",
                desc: "2005 - 2025: A little look back."
              }].map((item, index) => (
                <div
                  key={index}
                  className="group flex flex-col sm:flex-row gap-8 bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-200 transition duration-300"
                >

                  <div className="w-full sm:w-44 h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200">
                    <img
                      src={item.img}
                      alt="News"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mt-3 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <button className="mt-6 text-blue-600 font-medium hover:text-blue-800 transition text-sm">
                      Read more →
                    </button>
                  </div>

                </div>
              ))}

            </div>

            {/* CONTACT CARD */}
            <div>
              <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100 sticky top-24 shadow-sm">

                <h3 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">
                  Contact Us
                </h3>

                <div className="space-y-8 text-sm">

                  <div>
                    <p className="text-gray-500 uppercase text-xs mb-2 tracking-wide">
                      Phone
                    </p>
                    <p className="font-medium text-gray-900 text-base">
                      0711 2526 7800
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 uppercase text-xs mb-2 tracking-wide">
                      Business Hours
                    </p>
                    <p className="text-gray-900 text-base">
                      Mon-Fri <br />
                      08:00 - 17:00
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 uppercase text-xs mb-2 tracking-wide">
                      E-mail
                    </p>
                    <p className="font-medium text-blue-700 text-base">
                      info@bwpost.de
                    </p>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ================= PRODUCT OVERVIEW ================= */}
        <section className="bg-gray-50 py-28">
          <div className="max-w-7xl mx-auto px-6">

            <div className="text-center mb-20">
              <p className="text-blue-600 font-semibold uppercase tracking-wider text-sm">
                Product Overview
              </p>
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight mt-4">
                BWPOST Products You Can Benefit From
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-10">

              {[
                "Daily Mail",
                "Info Post",
                "Packages & Express",
                "Registered Mail + PZA",
                "Digital Shipping",
                "Fulfillment Solutions",
              ].map((product, index) => (
                <div
                  key={index}
                  className="bg-white p-10 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition duration-300"
                >
                  <h3 className="text-lg font-semibold text-blue-700">
                    {product}
                  </h3>
                  <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                    Enterprise-grade shipping solutions tailored for business operations.
                  </p>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* ================= BUY STAMPS CTA ================= */}
        <section className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white py-28">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">

            <div>
              <p className="text-blue-200 font-medium mb-4 uppercase tracking-wide text-sm">
                Local Advantage
              </p>

              <h2 className="text-4xl font-bold mb-6 tracking-tight">
                Buy stamps online
              </h2>

              <p className="text-blue-100 mb-10 max-w-lg leading-relaxed">
                Send your mail throughout Germany with the regional stamp motifs
                of BWPOST — reliable, affordable, and efficient.
              </p>

              <button className="px-7 py-3 bg-white text-blue-700 font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition duration-300">
                Buy Stamps
              </button>
            </div>

            <div>
              <img
                src="/stuttgart_stage_januar2022.png"
                alt="Buy Stamps"
                className="rounded-3xl shadow-2xl"
              />
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
