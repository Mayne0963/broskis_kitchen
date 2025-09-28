"use client";

import { useState, useEffect } from "react";
import { CATERING_PACKAGES, ADDONS, MIN_GUESTS } from "@/config/catering";

// Menu options for different categories
export const MENU_OPTIONS = {
  meats: ["Jerk Chicken", "BBQ Ribs", "Oxtail", "Curry Goat", "Grilled Salmon", "Smoked Brisket"],
  sides: ["Mac & Cheese", "Candied Yams", "Fried Plantains", "Collard Greens", "Cabbage", "Rice & Peas"],
  drinks: ["Sweet Tea", "Lemonade", "Soda", "Bottled Water", "Iced Coffee"],
  appetizers: ["Fried Dumplings", "Crispy Wings", "Coconut Shrimp", "Plantain Bites"],
  desserts: ["Peach Cobbler", "Sweet Potato Pie", "Rum Cake", "Key Lime Pie"]
};

// Selection rules for each package type
export const MENU_RULES = {
  standard: { meats: 2, sides: 2, drinks: 0, appetizers: 0, desserts: 0 },
  premium: { meats: 3, sides: 3, drinks: 1, appetizers: 0, desserts: 0 },
  luxury: { meats: 3, sides: 3, drinks: 1, appetizers: 2, desserts: 1 }
};

// OptionGrid component for menu item selection
function OptionGrid({ title, items, selected, max, onToggle }: {
  title: string;
  items: string[];
  selected: string[];
  max: number;
  onToggle: (item: string) => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        <div className="text-xs text-slate-400">Selected {selected.length}/{max}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {items.map(item => {
          const isSelected = selected.includes(item);
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              aria-pressed={isSelected}
              className={`text-left rounded-lg p-2 border transition-all duration-300 ${
                isSelected
                  ? "border-yellow-400 bg-yellow-500/6 shadow-lg shadow-yellow-400/10"
                  : "border-slate-700 bg-[#0B0F15] hover:border-yellow-400 hover:bg-slate-800/50"
              }`}
            >
              <div className="font-medium text-slate-100">{item}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Catering() {
  const [pkg, setPkg] = useState("standard");
  const [guests, setGuests] = useState(50);
  const [addons, setAddons] = useState([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [event, setEvent] = useState({ date: "", address: "" });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Menu selection state
  const [menu, setMenu] = useState({
    meats: [] as string[],
    sides: [] as string[],
    drinks: [] as string[],
    appetizers: [] as string[],
    desserts: [] as string[]
  });

  // Helper function to toggle menu options with max enforcement
  function toggleOption(category: string, value: string, max: number) {
    setMenu(prev => {
      const current = new Set(prev[category as keyof typeof prev] as string[]);
      if (current.has(value)) {
        current.delete(value);
      } else {
        if (current.size >= max) {
          // Remove the first item (FIFO) when at max capacity
          const arr = Array.from(current);
          current.delete(arr[0]);
          current.add(value);
        } else {
          current.add(value);
        }
      }
      return { ...prev, [category]: Array.from(current) };
    });
  }

  // Menu validation function
  function validateMenu(pkgId: string, menuData: typeof menu) {
    const rule = MENU_RULES[pkgId as keyof typeof MENU_RULES];
    if ((menuData.meats || []).length > rule.meats) return `Please select up to ${rule.meats} meats`;
    if ((menuData.meats || []).length < Math.min(1, rule.meats)) return `Please select at least 1 meat`;
    if ((menuData.sides || []).length > rule.sides) return `Please select up to ${rule.sides} sides`;
    if (rule.drinks && (menuData.drinks || []).length !== rule.drinks) return `Please select ${rule.drinks} drink`;
    if (rule.desserts && (menuData.desserts || []).length !== rule.desserts) return `Please select ${rule.desserts} dessert`;
    return null;
  }

  // Calculate progress based on form completion
  const calculateProgress = () => {
    let progress = 25; // Step 1 always starts at 25%
    if (guests >= MIN_GUESTS) progress = 50; // Step 2
    if (customer.name && customer.email) progress = 75; // Step 3
    if (event.date && event.address) progress = 100; // Step 4
    return progress;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (guests < MIN_GUESTS) newErrors.guests = `Minimum ${MIN_GUESTS} guests required`;
    if (!customer.name.trim()) newErrors.name = "Name is required";
    if (!customer.email.trim()) newErrors.email = "Email is required";
    if (!event.date) newErrors.date = "Event date is required";
    if (!event.address.trim()) newErrors.address = "Event address is required";
    
    // Validate menu selections
    const menuError = validateMenu(pkg, menu);
    if (menuError) newErrors.menu = menuError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset menu selections when package changes to respect new limits
  useEffect(() => {
    const rules = MENU_RULES[pkg as keyof typeof MENU_RULES];
    setMenu(prev => ({
      meats: prev.meats.slice(0, rules.meats),
      sides: prev.sides.slice(0, rules.sides),
      drinks: prev.drinks.slice(0, rules.drinks),
      appetizers: prev.appetizers.slice(0, rules.appetizers),
      desserts: prev.desserts.slice(0, rules.desserts)
    }));
  }, [pkg]);

  useEffect(() => {
    fetch("/api/catering/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: pkg, guests, addons })
    })
      .then(r => r.json())
      .then(setEstimate);
  }, [pkg, guests, addons]);

  async function submit() {
    setLoading(true);
    
    // Validate menu before submission
    const menuError = validateMenu(pkg, menu);
    if (menuError) {
      setErrors(prev => ({ ...prev, menu: menuError }));
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    const res = await fetch("/api/catering/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        event,
        packageId: pkg,
        guests,
        addons,
        menu
      })
    });
    const d = await res.json();
    setLoading(false);
    if (d?.stripe?.checkoutUrl) {
      window.location.href = d.stripe.checkoutUrl;
    } else {
      alert("Submitted!");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-emerald-500 opacity-90"></div>
        <div className="relative px-6 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-black drop-shadow-lg">
            Broski&apos;s Catering
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-slate-800 font-medium max-w-2xl mx-auto">
            Luxury street-gourmet experiences for events &amp; celebrations
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/50 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-yellow-300">Progress</span>
            <span className="text-sm font-medium text-yellow-300">{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Step 1: Choose Package */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold mr-3">
              1
            </div>
            <h2 className="text-2xl font-bold text-yellow-300">Choose Package</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {CATERING_PACKAGES.map(p => (
              <button
                key={p.id}
                onClick={() => setPkg(p.id)}
                className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  pkg === p.id 
                    ? "border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 shadow-lg shadow-yellow-500/20" 
                    : "border-slate-700 bg-[#0B0F15] hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/10"
                }`}
              >
                {pkg === p.id && (
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 to-amber-500/20 animate-pulse"></div>
                )}
                <div className="relative">
                  <div className="text-2xl font-bold text-yellow-300 mb-2">{p.name}</div>
                  <div className="text-3xl font-extrabold text-white mb-4">${p.pricePerGuest}<span className="text-lg text-slate-400">/guest</span></div>
                  <div className="space-y-2">
                    {p.includes.map((item, idx) => (
                      <div key={idx} className="flex items-center text-slate-300">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Menu Selection */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold mr-3">
              2
            </div>
            <h2 className="text-2xl font-bold text-yellow-300">Menu Selection</h2>
          </div>
          
          {errors.menu && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm font-medium">{errors.menu}</p>
            </div>
          )}
          
          <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                {CATERING_PACKAGES.find(p => p.id === pkg)?.name} Package Menu
              </h3>
              <p className="text-slate-400 text-sm">
                Customize your menu selection based on your package tier
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {(() => {
                const rules = MENU_RULES[pkg as keyof typeof MENU_RULES];
                return (
                  <>
                    {/* Meats */}
                    <div>
                      <OptionGrid
                        title="Meats"
                        items={MENU_OPTIONS.meats}
                        selected={menu.meats}
                        max={rules.meats}
                        onToggle={(v) => toggleOption("meats", v, rules.meats)}
                      />
                    </div>
                    
                    {/* Sides */}
                    <div>
                      <OptionGrid
                        title="Sides"
                        items={MENU_OPTIONS.sides}
                        selected={menu.sides}
                        max={rules.sides}
                        onToggle={(v) => toggleOption("sides", v, rules.sides)}
                      />
                    </div>
                    
                    {/* Drinks - only for premium and luxury */}
                    {rules.drinks > 0 && (
                      <div>
                        <OptionGrid
                          title="Drinks"
                          items={MENU_OPTIONS.drinks}
                          selected={menu.drinks}
                          max={rules.drinks}
                          onToggle={(v) => toggleOption("drinks", v, rules.drinks)}
                        />
                      </div>
                    )}
                    
                    {/* Appetizers - only for luxury */}
                    {rules.appetizers > 0 && (
                      <div>
                        <OptionGrid
                          title="Appetizers"
                          items={MENU_OPTIONS.appetizers}
                          selected={menu.appetizers}
                          max={rules.appetizers}
                          onToggle={(v) => toggleOption("appetizers", v, rules.appetizers)}
                        />
                      </div>
                    )}
                    
                    {/* Desserts - only for luxury */}
                    {rules.desserts > 0 && (
                      <div>
                        <OptionGrid
                          title="Desserts"
                          items={MENU_OPTIONS.desserts}
                          selected={menu.desserts}
                          max={rules.desserts}
                          onToggle={(v) => toggleOption("desserts", v, rules.desserts)}
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Step 3: Guests & Add-ons */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold mr-3">
              3
            </div>
            <h2 className="text-2xl font-bold text-yellow-300">Guests &amp; Add-ons</h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Guests Input */}
            <div>
              <label className="block text-lg font-semibold text-slate-200 mb-3">
                Number of Guests
              </label>
              <input
                type="number"
                min={MIN_GUESTS}
                value={guests}
                onChange={e => setGuests(+e.target.value)}
                className="w-full p-4 rounded-lg bg-slate-900 border-2 border-slate-700 text-white text-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all duration-300"
                placeholder={`Minimum ${MIN_GUESTS} guests`}
              />
              {errors.guests && (
                <p className="mt-2 text-red-400 text-sm font-medium">{errors.guests}</p>
              )}
            </div>

            {/* Add-ons */}
            <div>
              <label className="block text-lg font-semibold text-slate-200 mb-3">
                Add-ons
              </label>
              <div className="grid gap-3">
                {ADDONS.map(a => {
                  const isSelected = addons.some(x => x.id === a.id);
                  return (
                    <div
                      key={a.id}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? "border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 shadow-lg shadow-yellow-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-yellow-400 hover:bg-slate-800"
                      }`}
                      onClick={() =>
                        setAddons(s =>
                          isSelected
                            ? s.filter(x => x.id !== a.id)
                            : [...s, { id: a.id, qty: 1 }]
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{a.name}</div>
                          <div className="text-slate-400 text-sm">{a.type}</div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-yellow-300 font-bold text-lg mr-3">${a.price}</span>
                          <button
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                              isSelected
                                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                                : "bg-slate-700 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                            }`}
                          >
                            {isSelected ? "Remove" : "Add"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live Estimate Panel */}
        {estimate && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-yellow-600/20 to-emerald-500/20 border-2 border-yellow-400/50 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-yellow-300 mb-4 text-center">Live Estimate</h3>
              <div className="grid md:grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-slate-300 text-lg mb-2">Event Subtotal</div>
                  <div className="text-3xl font-bold text-white">${estimate.subtotal}</div>
                </div>
                <div>
                  <div className="text-slate-300 text-lg mb-2">Required Deposit</div>
                  <div className="text-4xl font-extrabold text-yellow-300">${estimate.deposit}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Event Info */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold mr-3">
              4
            </div>
            <h2 className="text-2xl font-bold text-yellow-300">Event Information</h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold text-slate-200 mb-3">
                Contact Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={customer.name}
                onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
                className="w-full p-4 rounded-lg bg-slate-900 border-2 border-slate-700 text-white text-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all duration-300"
              />
              {errors.name && (
                <p className="mt-2 text-red-400 text-sm font-medium">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-slate-200 mb-3">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={customer.email}
                onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))}
                className="w-full p-4 rounded-lg bg-slate-900 border-2 border-slate-700 text-white text-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all duration-300"
              />
              {errors.email && (
                <p className="mt-2 text-red-400 text-sm font-medium">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-slate-200 mb-3">
                Event Date
              </label>
              <input
                type="date"
                value={event.date}
                onChange={e => setEvent(ev => ({ ...ev, date: e.target.value }))}
                className="w-full p-4 rounded-lg bg-slate-900 border-2 border-slate-700 text-white text-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all duration-300"
              />
              {errors.date && (
                <p className="mt-2 text-red-400 text-sm font-medium">{errors.date}</p>
              )}
            </div>
            
            <div>
              <label className="block text-lg font-semibold text-slate-200 mb-3">
                Event Address
              </label>
              <input
                type="text"
                placeholder="Full event address"
                value={event.address}
                onChange={e => setEvent(ev => ({ ...ev, address: e.target.value }))}
                className="w-full p-4 rounded-lg bg-slate-900 border-2 border-slate-700 text-white text-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all duration-300"
              />
              {errors.address && (
                <p className="mt-2 text-red-400 text-sm font-medium">{errors.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 5: Review & Reserve */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold mr-3">
              5
            </div>
            <h2 className="text-2xl font-bold text-yellow-300">Review &amp; Reserve</h2>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => {
                if (validateForm()) {
                  submit();
                }
              }}
              disabled={loading}
              className="w-full max-w-md mx-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-400/25"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3"></div>
                  Processing…
                </div>
              ) : (
                "Reserve with Deposit"
              )}
            </button>
            
            {estimate && (
              <p className="mt-4 text-slate-400">
                You&apos;ll pay ${estimate.deposit} today to secure your booking
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}