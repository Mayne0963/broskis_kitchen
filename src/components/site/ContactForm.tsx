export default function ContactForm() {
  return (
    <section className="container-lg my-10">
      <div className="card shadow-luxe">
        <h2 className="h2 mb-4">Let&apos;s Talk</h2>
        <form className="space-y-4">
          <div className="form-row">
            <label className="label">
              Name
              <input className="input input--lg w-full mt-1" placeholder="Your full name" />
            </label>
            <label className="label">
              Email
              <input className="input input--lg w-full mt-1" type="email" placeholder="you@broskis.com" />
            </label>
          </div>
          <label className="label block">
            Message
            <textarea className="input w-full mt-1 h-32" placeholder="How can we serve you?" />
          </label>
          <button
            className="btn btn-lg border-[1.5px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(241,196,83,.22), rgba(241,196,83,.12))",
              borderColor: "var(--bk-gold)",
              color: "#1a1400",
            }}
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}