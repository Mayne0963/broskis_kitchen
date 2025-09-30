import React from 'react';

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-black bg-opacity-90 z-50 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">Broski's Kitchen</h1>
          <div className="hidden md:flex space-x-6">
            <a href="#" className="text-white hover:text-yellow-400">Home</a>
            <a href="#" className="text-white hover:text-yellow-400">Menu</a>
            <a href="#" className="text-white hover:text-yellow-400">About</a>
            <a href="#" className="text-white hover:text-yellow-400">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section min-h-screen flex items-center justify-center text-center px-4 pt-20">
        <div className="hero-content max-w-4xl">
          <h1 className="hero-title text-6xl md:text-8xl font-bold mb-6 text-yellow-400">
            Broski's Kitchen
          </h1>
          <h2 className="hero-subtitle text-2xl md:text-4xl mb-8 text-white">
            Luxury Street Gourmet
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Where flavor meets culture. Experience the finest street gourmet cuisine 
            crafted with passion and served with style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary px-8 py-4 text-lg font-bold rounded-lg">
              Order Now
            </button>
            <button className="border-2 border-yellow-400 text-yellow-400 px-8 py-4 text-lg font-bold rounded-lg hover:bg-yellow-400 hover:text-black transition-all">
              View Menu
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-yellow-400">
            Why Choose Broski's Kitchen?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-yellow-400 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Premium Quality</h3>
              <p className="text-gray-300">
                Only the finest ingredients and authentic recipes for an exceptional dining experience.
              </p>
            </div>
            <div className="text-center p-6 border border-yellow-400 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Fast Delivery</h3>
              <p className="text-gray-300">
                Quick and reliable delivery service to bring our gourmet food right to your door.
              </p>
            </div>
            <div className="text-center p-6 border border-yellow-400 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Unique Flavors</h3>
              <p className="text-gray-300">
                Innovative fusion of street food culture with luxury dining standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 text-yellow-400">Broski's Kitchen</h3>
          <p className="text-gray-400 mb-4">Luxury Street Gourmet</p>
          <p className="text-gray-500">© 2024 Broski's Kitchen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

