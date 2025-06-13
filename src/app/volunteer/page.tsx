"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FaHandsHelping,
  FaUtensils,
  FaUsers,
  FaHeart,
  FaGraduationCap,
  FaHandshake,
  FaCertificate,
  FaCheckCircle,
  FaQuestionCircle,
  FaArrowRight,
} from "react-icons/fa"
import VolunteerForm from "../../components/volunteer/VolunteerForm"
import TestimonialSlider from "../../components/volunteer/TestimonialSlider"
import RequirementCard from "../../components/volunteer/RequirementCard"
import OpportunityCard from "../../components/volunteer/OpportunityCard"
import {
  volunteerTestimonials,
  volunteerFAQs,
  volunteerOpportunities,
  volunteerRequirements,
} from "../../data/volunteer-data"

export default function VolunteerPage() {
  const [activeTab, setActiveTab] = useState("opportunities")
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-70 z-10"></div>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/volunteer-hero.jpg')" }}
          ></div>
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="heading-xl mb-4 text-white gritty-shadow">Join Our Volunteer Team</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Make a difference in your community while gaining valuable experience in the culinary world.
          </p>
          <div className="mt-8">
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Apply Now
            </button>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-[#111111]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaHandsHelping className="text-gold-foil text-4xl" />
            </div>
            <h2 className="text-3xl font-bold mb-6">Our Volunteer Mission</h2>
            <p className="text-xl text-gray-300 mb-8">
              At Broski&apos;s Kitchen, we believe in giving back to our community. Our volunteer program provides
              opportunities for individuals to contribute their time and talents while gaining valuable experience in
              the culinary industry.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHeart className="text-gold-foil text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Community Impact</h3>
                <p className="text-gray-400">Help us serve those in need and strengthen our local community.</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaGraduationCap className="text-gold-foil text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Skill Development</h3>
                <p className="text-gray-400">Gain hands-on experience and learn from industry professionals.</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHandshake className="text-gold-foil text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Meaningful Connections</h3>
                <p className="text-gray-400">
                  Build relationships with like-minded individuals who share your passion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-8 bg-[#0A0A0A] sticky top-20 z-30 border-b border-[#333333]">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto pb-2 hide-scrollbar">
            <button
              className={`px-6 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "opportunities"
                  ? "text-gold-foil border-b-2 border-gold-foil"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("opportunities")}
            >
              Volunteer Opportunities
            </button>
            <button
              className={`px-6 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "requirements"
                  ? "text-gold-foil border-b-2 border-gold-foil"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("requirements")}
            >
              Requirements
            </button>
            <button
              className={`px-6 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "benefits"
                  ? "text-gold-foil border-b-2 border-gold-foil"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("benefits")}
            >
              Volunteer Benefits
            </button>
            <button
              className={`px-6 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "testimonials"
                  ? "text-gold-foil border-b-2 border-gold-foil"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("testimonials")}
            >
              Testimonials
            </button>
            <button
              className={`px-6 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "faq" ? "text-gold-foil border-b-2 border-gold-foil" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("faq")}
            >
              FAQ
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Volunteer Opportunities Tab */}
          {activeTab === "opportunities" && (
            <div className="animate-fade-in">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Volunteer Opportunities</h2>
                <p className="text-gray-300 text-lg">
                  We offer a variety of volunteer positions to match your skills and interests. All volunteers receive
                  training and support from our experienced staff.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {volunteerOpportunities.map((opportunity, index) => (
                  <OpportunityCard key={index} opportunity={opportunity} />
                ))}
              </div>

              <div className="text-center mt-12">
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 mx-auto">
                  Apply to Volunteer <FaArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* Requirements Tab */}
          {activeTab === "requirements" && (
            <div className="animate-fade-in">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Volunteer Requirements</h2>
                <p className="text-gray-300 text-lg">
                  We welcome volunteers from all backgrounds. Here are some general requirements for joining our
                  volunteer team.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {volunteerRequirements.map((requirement, index) => (
                  <RequirementCard key={index} requirement={requirement} />
                ))}
              </div>

              <div className="max-w-3xl mx-auto mt-12 p-6 bg-[#1A1A1A] rounded-lg border border-[#333333]">
                <h3 className="text-xl font-bold mb-4 text-center">Application Process</h3>
                <ol className="space-y-4">
                  <li className="flex items-start">
                    <span className="w-6 h-6 rounded-full bg-gold-foil text-black flex items-center justify-center mr-3 flex-shrink-0">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold">Submit Application</h4>
                      <p className="text-gray-400">
                        Complete our online volunteer application form with your information and interests.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 rounded-full bg-gold-foil text-black flex items-center justify-center mr-3 flex-shrink-0">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold">Interview</h4>
                      <p className="text-gray-400">
                        Selected applicants will be invited for a brief interview to discuss their interests and
                        availability.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 rounded-full bg-gold-foil text-black flex items-center justify-center mr-3 flex-shrink-0">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold">Orientation</h4>
                      <p className="text-gray-400">
                        Attend a volunteer orientation session to learn about our mission, policies, and procedures.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-6 h-6 rounded-full bg-gold-foil text-black flex items-center justify-center mr-3 flex-shrink-0">
                      4
                    </span>
                    <div>
                      <h4 className="font-bold">Training</h4>
                      <p className="text-gray-400">
                        Receive role-specific training from our staff to prepare you for your volunteer position.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Benefits Tab */}
          {activeTab === "benefits" && (
            <div className="animate-fade-in">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Volunteer Benefits</h2>
                <p className="text-gray-300 text-lg">
                  Volunteering at Broski&apos;s Kitchen offers numerous benefits beyond the satisfaction of giving back
                  to your community.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
                  <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <FaUtensils className="text-gold-foil text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Culinary Experience</h3>
                  <p className="text-gray-400 mb-4">
                    Gain hands-on experience in a professional kitchen environment and learn from our skilled chefs.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Learn food preparation techniques</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Understand kitchen operations</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Develop culinary skills</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
                  <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <FaCertificate className="text-gold-foil text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Professional Development</h3>
                  <p className="text-gray-400 mb-4">
                    Build your resume and develop transferable skills that can benefit your career.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Receive a certificate of service</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Potential for recommendation letters</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Networking opportunities</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
                  <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <FaUsers className="text-gold-foil text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Community Connection</h3>
                  <p className="text-gray-400 mb-4">
                    Build meaningful relationships and connect with your community in a positive way.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Meet like-minded individuals</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Participate in community events</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Make a positive local impact</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
                  <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <FaHeart className="text-gold-foil text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Volunteer Perks</h3>
                  <p className="text-gray-400 mb-4">
                    Enjoy special benefits as a thank you for your dedication and service.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Complimentary meal during shifts</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>20% discount on menu items</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-gold-foil mt-1 mr-2 flex-shrink-0" />
                      <span>Exclusive volunteer appreciation events</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Testimonials Tab */}
          {activeTab === "testimonials" && (
            <div className="animate-fade-in">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Volunteer Testimonials</h2>
                <p className="text-gray-300 text-lg">
                  Hear from our current and past volunteers about their experiences at Broski&apos;s Kitchen.
                </p>
              </div>

              <TestimonialSlider testimonials={volunteerTestimonials} />

              <div className="max-w-3xl mx-auto mt-16 bg-[#1A1A1A] rounded-lg p-8 border border-[#333333] text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Join Our Team?</h3>
                <p className="text-gray-300 mb-6">
                  We&apos;re always looking for passionate individuals to join our volunteer family.
                </p>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  Apply Now
                </button>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === "faq" && (
            <div className="animate-fade-in">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-gray-300 text-lg">
                  Find answers to common questions about volunteering at Broski&apos;s Kitchen.
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-6">
                {volunteerFAQs.map((faq, index) => (
                  <div key={index} className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
                    <h3 className="text-lg font-bold mb-2 flex items-center">
                      <FaQuestionCircle className="text-gold-foil mr-2 flex-shrink-0" /> {faq.question}
                    </h3>
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="max-w-3xl mx-auto mt-12 text-center">
                <p className="text-gray-300 mb-6">
                  Don&apos;t see your question? Contact our volunteer coordinator for more information.
                </p>
                <Link href="/contact" className="btn-outline inline-flex items-center gap-2">
                  Contact Us <FaArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="py-16 bg-[#111111]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Volunteer Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-gold-foil mb-2">5,000+</div>
              <p className="text-gray-300">Volunteer Hours</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gold-foil mb-2">200+</div>
              <p className="text-gray-300">Active Volunteers</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gold-foil mb-2">15,000+</div>
              <p className="text-gray-300">Meals Served</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gold-foil mb-2">12</div>
              <p className="text-gray-300">Community Partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-[#880808]/20 opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="heading-lg mb-4 gritty-shadow">Make a Difference Today</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our volunteer team and help us make a positive impact in our community while gaining valuable
            experience.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Apply to Volunteer
          </button>
        </div>
      </section>

      {/* Volunteer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
          <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
            <VolunteerForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
