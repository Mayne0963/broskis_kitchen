#!/bin/bash

# Add admin button to desktop dropdown menu
awk '/Order History/{print; print "              </AccessibleMenuItem>"; print "              {user?.role === \"admin\" && ("; print "                <AccessibleMenuItem "; print "                  href=\"/admin\dashboard""; print "                  onClick={() => setUserDropdownOpen(false)}"; print "                >"; print "                  Admin Dashboard"; print "                </AccessibleMenuItem>"; print "              )}"; next} 1' src/components/layout/Navbar.tsx > temp_navbar.tsx

# Add admin button to mobile menu
awk '/Order History/{if(mobile_section) {print; print "                </Link>"; print "                {user?.role === \"admin\" && ("; print "                  <Link"; print "                    href=\"/admin\dashboard""; print "                    className=\"block py-2 hover:text-gold-foil transition-colors duration-300 text-red-600 font-medium\""; print "                    onClick={() => setMobileMenuOpen(false)}"; print "                  >"; print "                    Admin Dashboard"; print "                  </Link>"; print "                )}"; next} else {print; next}} /className=.*mobile.*menu/ {mobile_section=1} 1' temp_navbar.tsx > src/components/layout/Navbar.tsx

rm temp_navbar.tsx
