import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/lib/auth";
import bujet_landing_page_image from "@/../../assets/bujet_landing_page_image.png";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative bg-white overflow-hidden flex-grow">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Track your money</span>{" "}
                  <span className="block text-purple-700 xl:inline">
                    with ease
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Take control of your finances with Bujet. Track expenses,
                  monitor accounts, and manage transactions all at one place.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href={user ? "/dashboard" : "/auth"}>
                      <Button className="w-full py-3 px-8 md:py-4 md:text-lg md:px-10">
                        {user ? "Open App" : "Get Started"}
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Button
                      variant="secondary"
                      className="w-full py-3 px-8 md:py-4 md:text-lg md:px-10"
                    >
                      Learn more
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            width={700}
            height={700}
            style={{opacity: 0.9}}
            src={bujet_landing_page_image}
            alt="Financial dashboard"
          />
        </div>
      </section>
    </div>
  );
}
