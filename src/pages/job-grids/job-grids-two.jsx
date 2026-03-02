import { useEffect, useState, useRef } from "react";
import { LuSearch } from "../../assets/icons/vander";
import VacanciesAPI from "../../api/apiList/vacancies";
import IndustryAPI from "../../api/apiList/industries";
import EmploymentTypeApi from "../../api/apiList/employmentTypes";
import JobGridsTwoComp from "../../components/job-grids-two-comp";
import { Link } from "react-router-dom";
import { IoIosArrowDown } from "react-icons/io";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function JobGridsTwo() {
  const { t } = useTranslation();
  const [industries, setIndustries] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [expandedIndustry, setExpandedIndustry] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCategoriesOpen, setCategoriesOpen] = useState(true);
  const [isEmploymentOpen, setEmploymentOpen] = useState(true);

  const dropdownRef = useRef(null);

  // Read multiple filter values from URL on initial load
  const [filters, setFilters] = useState(() => {
    const text = searchParams.get("search") ?? searchParams.get("text") ?? "";
    const industry = searchParams.getAll("industry[]");
    const occupation = searchParams.getAll("occupation[]");
    const employment_type = searchParams.getAll("employment_type[]") || [];
    // Also support legacy "type" param
    const legacyType = searchParams.get("type");
    if (legacyType && !employment_type.includes(legacyType)) {
      employment_type.push(legacyType);
    }
    return {
      text,
      industry,
      occupation,
      employment_type,
      page: 1,
      size: 15,
    };
  });

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  /* =======================
     FETCH INDUSTRIES & TYPES
  ======================= */
  useEffect(() => {
    IndustryAPI.getIndustries(1, 10000, { relationsOccupations: true }).then(
      (res) => {
        const sortedIndustries = res.data.data.map(ind => {
          if (ind.occupations) {
            return {
              ...ind,
              occupations: [...ind.occupations].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
            };
          }
          return ind;
        }).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

        setIndustries(sortedIndustries);
      }
    );

    EmploymentTypeApi.getEmploymentTypes(1, 10000).then((res) =>
      setEmploymentTypes(res.data.data)
    );
  }, []);

  // On mobile/tablet collapse filter blocks by default; keep open on desktop
  useEffect(() => {
    const updateFilterStateByViewport = () => {
      const isMobile = window.innerWidth < 1024;
      setCategoriesOpen(!isMobile);
      setEmploymentOpen(!isMobile);
    };

    updateFilterStateByViewport();
    window.addEventListener("resize", updateFilterStateByViewport);
    return () => window.removeEventListener("resize", updateFilterStateByViewport);
  }, []);

  /* =======================
     FETCH JOBS
  ======================= */
  const fetchJobs = async (page = 1) => {
    try {
      const res = await VacanciesAPI.searchJobPosts({
        text: filters.text,
        industry: filters.industry,
        occupation: filters.occupation,
        employment_type: filters.employment_type,
        page,
        size: filters.size,
      });

      setJobs(res.data.data);
      setPagination({
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
        total: res.data.meta.total,
      });
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Sync URL search params whenever filters change
  useEffect(() => {
    fetchJobs(filters.page);

    const params = new URLSearchParams();
    if (filters.text) params.set("search", filters.text);
    filters.industry.forEach((id) => params.append("industry[]", id));
    filters.occupation.forEach((id) => params.append("occupation[]", id));
    filters.employment_type.forEach((id) => params.append("employment_type[]", id));

    setSearchParams(params, { replace: true });
  }, [filters]);

  /* =======================
     HANDLERS
  ======================= */
  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, text: e.target.value, page: 1 }));
  };

  const handleIndustrySelect = (industryId) => {
    setExpandedIndustry((prev) => (prev === industryId ? null : industryId));

    // Find child occupation IDs for this industry
    const industry = industries.find((ind) => ind.id === industryId);
    const childOccupationIds = industry?.occupations?.map((occ) => occ.id) || [];

    setFilters((prev) => {
      const alreadySelected = prev.industry.includes(industryId);

      if (alreadySelected) {
        // Deselecting industry → remove industry + its child occupations
        return {
          ...prev,
          industry: prev.industry.filter((id) => id !== industryId),
          occupation: prev.occupation.filter(
            (id) => !childOccupationIds.includes(id)
          ),
          page: 1,
        };
      } else {
        // Selecting industry → add industry + auto-select all child occupations
        const newOccupations = [
          ...prev.occupation,
          ...childOccupationIds.filter((id) => !prev.occupation.includes(id)),
        ];
        return {
          ...prev,
          industry: [...prev.industry, industryId],
          occupation: newOccupations,
          page: 1,
        };
      }
    });
  };

  const handleOccupationSelect = (occupationId) => {
    setFilters((prev) => {
      const alreadySelected = prev.occupation.includes(occupationId);
      return {
        ...prev,
        occupation: alreadySelected
          ? prev.occupation.filter((id) => id !== occupationId)
          : [...prev.occupation, occupationId],
        page: 1,
      };
    });
  };

  const handleEmploymentTypeSelect = (id) => {
    setFilters((prev) => {
      const alreadySelected = prev.employment_type.includes(id);
      return {
        ...prev,
        employment_type: alreadySelected
          ? prev.employment_type.filter((t) => t !== id)
          : [...prev.employment_type, id],
        page: 1,
      };
    });
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  /* =======================
     CLOSE DROPDOWN ON CLICK OUTSIDE
  ======================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExpandedIndustry(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative table w-full py-24 bg-[url('../../assets/images/hero/bg.jpg')] bg-top bg-no-repeat bg-cover">
        <div className="absolute inset-0 bg-emerald-900/90"></div>
        <div className="container">
          <div className="grid grid-cols-1 text-center mt-10">
            <h3 className="md:text-3xl text-2xl font-medium text-white">
              Job Vacancies
            </h3>
          </div>
        </div>
        <div className="absolute bottom-5 start-0 end-0 text-center z-10">
          <ul className="breadcrumb breadcrumb-light inline-block">
            <li className="inline text-white/50">
              <Link to="/index">Octopus</Link>
            </li>
            <li className="inline text-white ms-2">Vacancies</li>
          </ul>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-10">
        <div className="container grid md:grid-cols-12 gap-8">
          {/* FILTER SIDEBAR */}
          <div className="md:col-span-4 mb-4">
            <div className="p-6 sticky top-20 filter-panel me-2">
              <div className="mb-6">
                <label className="filter-section-title">{t('search.button')}</label>
                <div className="filter-input-wrap mt-2">
                  <LuSearch className="filter-icon" />
                  <input
                    type="text"
                    value={filters.text}
                    onChange={handleSearchChange}
                    className="filter-input"
                    placeholder={t('search.searchjJobs')}
                  />
                </div>
              </div>

              {/* CATEGORIES */}
              {/* CATEGORIES */}
              <div className="flex flex-col filter-scroll lg:overflow-y-auto lg:max-h-[80vh]">
                <div className="mb-2 px-2.5">
                  <button
                    type="button"
                    className="filter-section-title filter-card p-3 w-full flex items-center justify-between mb-3"
                    onClick={() => setCategoriesOpen((prev) => !prev)}
                  >
                    <span>{t('categories.categories')}</span>
                    <IoIosArrowDown
                      className={`text-lg transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    ref={dropdownRef}
                    className={`flex flex-col gap-3 transition-all duration-200 ${isCategoriesOpen ? "" : "hidden"
                      }`}
                  >
                    {industries.map((industry) => {
                      const isOpen = expandedIndustry === industry.id;
                      const isSelected = filters.industry.includes(industry.id);

                      return (
                        <div
                          key={industry.id}
                          className={`filter-card ${isOpen || isSelected ? "filter-card-active" : ""}`}
                        >
                          {/* INDUSTRY HEADER */}
                          <div
                            className={`filter-card-header cursor-pointer ${isOpen || isSelected ? "filter-card-header-active" : ""}`}
                            onClick={() =>
                              setExpandedIndustry(isOpen ? null : industry.id)
                            }
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleIndustrySelect(industry.id)}
                                className="filter-check"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="font-medium">
                                {industry.name}
                              </span>
                            </label>

                            {industry.occupations?.length > 0 && (
                              <IoIosArrowDown
                                className={`text-slate-500 transition-transform duration-300 rounded-lg ${isOpen ? "rotate-180" : ""
                                  }`}
                              />
                            )}
                          </div>

                          {/* OCCUPATIONS DROPDOWN */}
                          {isOpen && industry.occupations && (
                            <div className="filter-card-body">
                              {industry.occupations.map((occ) => {
                                const occSelected = filters.occupation.includes(occ.id);

                                return (
                                  <label
                                    key={occ.id}
                                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition filter-pill ${occSelected ? "filter-pill-active" : ""}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={occSelected}
                                      onChange={() =>
                                        handleOccupationSelect(occ.id)
                                      }
                                      className="filter-check"
                                    />
                                    <span className="text-sm">{occ.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>


                <div className="mb-2 px-2.5">
                  <button
                    type="button"
                    className="filter-section-title filter-card p-3 w-full flex items-center justify-between mb-3"
                    onClick={() => setEmploymentOpen((prev) => !prev)}
                  >
                    <span>{t('vacancyDetail.employeeType')}</span>
                    <IoIosArrowDown
                      className={`text-lg transition-transform ${isEmploymentOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`flex flex-col gap-3 transition-all duration-200 ${isEmploymentOpen ? "" : "hidden"
                      }`}
                  >
                    {employmentTypes.map((type) => {
                      const isSelected = filters.employment_type.includes(type.id);

                      return (
                        <div
                          key={type.id}
                          className={`filter-card ${isSelected ? "filter-card-active" : ""}`}
                        >
                          <label
                            className={`filter-card-header cursor-pointer ${isSelected ? "filter-card-header-active" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleEmploymentTypeSelect(type.id)}
                              className="filter-check"
                            />
                            <span className="font-medium">
                              {type.name}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="md:col-span-8">
            <JobGridsTwoComp
              jobs={jobs}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </section>
    </>
  );
}
