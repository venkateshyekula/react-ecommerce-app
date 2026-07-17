import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { faqSections } from "../data/faqData";

const FaqPage = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    faqSections[0]?.id ?? "topQueries"
  );
  const [searchText, setSearchText] = useState<string>("");

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return faqSections;
    }

    return faqSections
      .map((section) => ({
        ...section,
        questions: section.questions.filter((item) =>
          `${item.question} ${item.answer ?? ""}`
            .toLowerCase()
            .includes(normalizedSearch)
        )
      }))
      .filter(
        (section) =>
          section.title.toLowerCase().includes(normalizedSearch) ||
          section.description?.toLowerCase().includes(normalizedSearch) ||
          section.questions.length > 0
      );
  }, [searchText]);

  useEffect(() => {
    if (filteredSections.length === 0) {
      return;
    }

    const hasActiveSection = filteredSections.some(
      (section) => section.id === activeSectionId
    );

    if (!hasActiveSection) {
      setActiveSectionId(filteredSections[0].id);
    }
  }, [filteredSections, activeSectionId]);

  useEffect(() => {
    const sectionElements = filteredSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (sectionElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top
          );

        const activeEntry = visibleEntries[0];

        if (activeEntry?.target.id) {
          setActiveSectionId(activeEntry.target.id);
        }
      },
      {
        root: null,
        rootMargin: "-145px 0px -55% 0px",
        threshold: 0.1
      }
    );

    sectionElements.forEach((element) => observer.observe(element));

    return () => {
      sectionElements.forEach((element) => observer.unobserve(element));
    };
  }, [filteredSections]);

  const handleSectionClick = (sectionId: string): void => {
    const sectionElement = document.getElementById(sectionId);

    if (!sectionElement) {
      return;
    }

    setActiveSectionId(sectionId);

    sectionElement.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  return (
    <main className="faq-page bg-light">
      <section className="faq-page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="row justify-content-center">
            <div className="col-xl-11">
              <div className="d-flex flex-column flex-lg-row justify-content-between gap-4">
                <div>
                  <h1 className="fw-bold mb-2">Frequently Asked Questions</h1>

                  <p className="text-muted mb-0">
                    Find answers about orders, payments, returns, refunds,
                    wallet, rewards, coupons and account settings.
                  </p>
                </div>

                <div className="faq-contact-box bg-light border rounded-4 p-3 text-lg-end">
                  <p className="text-muted small mb-1">Still need help?</p>

                  <Link
                    to="/contact-support"
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Contact us
                  </Link>
                </div>
              </div>

              <div className="faq-search-wrapper mt-4">
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-muted" />
                  </span>

                  <input
                    className="form-control"
                    placeholder="Search FAQs..."
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4 py-lg-5">
        <div className="row justify-content-center">
          <div className="col-xl-11">
            {filteredSections.length === 0 ? (
              <div className="faq-empty-state bg-white border-bottom text-center py-5 px-4">
                <i className="bi bi-search fs-1 text-muted d-block mb-3" />

                <h5 className="fw-bold">No FAQs found</h5>

                <p className="text-muted mb-3">
                  Try another keyword or clear your search.
                </p>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchText("")}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="faq-vertical-layout">
                <aside className="faq-vertical-sidebar">
                  <div className="faq-vertical-sidebar-card bg-white">
                    <div className="p-3 border-bottom">
                      <h6 className="fw-bold mb-1">FAQ Categories</h6>
                      <p className="text-muted small mb-0">
                        Select a category or scroll the page.
                      </p>
                    </div>

                    <ul className="faq-vertical-tabs list-unstyled mb-0 border-bottom">
                      {filteredSections.map((section) => (
                        <li key={section.id}>
                          <button
                            type="button"
                            className={`faq-vertical-tab ${
                              activeSectionId === section.id ? "active" : ""
                            }`}
                            onClick={() => handleSectionClick(section.id)}
                          >
                            <span className="faq-vertical-tab-marker" />
                            <span>{section.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>

                <section className="faq-vertical-content">
                  {filteredSections.map((section) => (
                    <section
                      id={section.id}
                      className="faq-flow-section bg-white border-bottom"
                      key={section.id}
                    >
                      <div className="faq-flow-section-header border-bottom p-4">
                        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                          <div>
                            <h2 className="fw-bold mb-2">{section.title}</h2>

                            {section.description ? (
                              <p className="text-muted mb-0">
                                {section.description}
                              </p>
                            ) : null}
                          </div>

                          {section.quickLinks?.length ? (
                            <div className="faq-flow-section-actions">
                              {section.quickLinks.map((link) => (
                                <Link
                                  to={link.path}
                                  className="btn btn-sm btn-outline-secondary"
                                  key={`${section.id}-${link.label}`}
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-4">
                        {section.questions.length === 0 ? (
                          <div className="text-muted">
                            No matching questions found in this category.
                          </div>
                        ) : (
                          <div className="faq-query-list">
                            {section.questions.map((item, index) => {
                              const collapseId = `faq-${section.id}-${index}`;

                              return (
                                <div className="faq-query" key={item.question}>
                                  <button
                                    className="faq-question"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target={`#${collapseId}`}
                                    aria-expanded="false"
                                    aria-controls={collapseId}
                                  >
                                    <span>{item.question}</span>
                                    <i className="bi bi-chevron-down" />
                                  </button>

                                  <div id={collapseId} className="collapse">
                                    <div className="faq-answer">
                                      {item.answer ??
                                        "More details will be added soon."}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </section>
                  ))}
                </section>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default FaqPage;