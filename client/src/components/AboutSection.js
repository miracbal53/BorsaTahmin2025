import React from "react";
const AboutSection = () => {
  return (
    <section id="about" className="about_section layout_padding">
      <div className="container">
        <div className="heading_container heading_center">
          <h2>
          <span style={{ color: "#fff" }}>About</span> <span>Us</span>
          </h2>
          <p>
            Magni quod blanditiis non minus sed aut voluptatum illum quisquam
            aspernatur ullam vel beatae rerum ipsum voluptatibus
          </p>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="img-box">
              <img src="/images/about-img.png" alt="About Us" />
            </div>
          </div>
          <div className="col-md-6">
            <div className="detail-box">
              <h3><span style={{ color: "#fff" }}>We Are Finexo </span></h3>
              <p>
                There are many variations of passages of Lorem Ipsum available,
                but the majority have suffered alteration in some form, by
                injected humour, or randomised words which don't look even
                slightly believable. If you are going to use a passage of Lorem
                Ipsum, you need to be sure there isn't anything embarrassing
                hidden in the middle of text.
              </p>
              <p>
                Molestiae odio earum non qui cumque provident voluptates,
                repellendus exercitationem, possimus at iste corrupti officiis
                unde alias eius ducimus reiciendis soluta eveniet. Nobis ullam
                ab omnis quasi expedita.
              </p>
              <a href="/hakkimizda">Read More</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
