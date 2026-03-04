import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";
import userImg from "../assets/images/user.png";
import { LuSearch, FiUser, FiSettings, FiLogOut } from "../assets/icons/vander";
import Languages from "../config/Languages";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../context/UserContext";
import LoginIcon from "../assets/icons/login.svg";
import { FaDollarSign } from "react-icons/fa6";
import axiosClient from "../api/axiosClient";
import { Dropdown, Button } from "antd";
import { DownOutlined } from "@ant-design/icons";

const Navbar = (props) => {
  const { refreshUser, user } = useUser();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { languages, changeLanguage } = Languages;

  const [currentLang, setCurrentLang] = useState(
    localStorage.getItem("language") ?? "en"
  );

  const [avatarUrl, setAvatarUrl] = useState(userImg);
  const [isDropdown, openDropdown] = useState(true);
  const { navClass, topnavClass, isContainerFluid } = props;
  const [isOpen, setMenu] = useState(true);
  const role = localStorage.getItem("role") ?? null;

  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSearch("");
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }

      navigate(`/vacancies?${params.toString()}`);
    }
  };

  const languageItems = languages.map((lang) => ({
    key: lang.code,
    label: lang.code.toUpperCase(),
  }));

  const handleLanguageChange = ({ key }) => {
    changeLanguage(key);
    setCurrentLang(key);
    location.reload();
  };

  window.addEventListener("scroll", windowScroll);

  useEffect(() => {
    activateMenu();
  }, []);

  useEffect(() => {
    if (user?.data?.logo) {
      setAvatarUrl(user.data.logo);
      return;
    }

    if (user?.data?.avatar) {
      axiosClient
        .get(user.data.avatar, {
          responseType: "blob",
          skipErrorToast: true,
        })
        .then((res) => {
          const objectUrl = URL.createObjectURL(res.data);
          setAvatarUrl(objectUrl);
        })
        .catch(() => {
          setAvatarUrl(userImg);
        });

      return;
    }

    setAvatarUrl(userImg);
  }, [user?.data?.logo, user?.data?.avatar]);

  function windowScroll() {
    const navbar = document.getElementById("topnav");
    if (
      document.body.scrollTop >= 50 ||
      document.documentElement.scrollTop >= 50
    ) {
      if (navbar !== null) {
        navbar?.classList.add("nav-sticky");
      }
    } else {
      if (navbar !== null) {
        navbar?.classList.remove("nav-sticky");
      }
    }

    const mybutton = document.getElementById("back-to-top");
    if (mybutton != null) {
      if (
        document.body.scrollTop > 500 ||
        document.documentElement.scrollTop > 500
      ) {
        mybutton.classList.add("flex");
        mybutton.classList.remove("hidden");
      } else {
        mybutton.classList.add("hidden");
        mybutton.classList.remove("flex");
      }
    }
  }

  const toggleMenu = () => {
    setMenu(!isOpen);
    if (document.getElementById("navigation")) {
      const anchorArray = Array.from(
        document.getElementById("navigation").getElementsByTagName("a")
      );
      anchorArray.forEach((element) => {
        element.addEventListener("click", (elem) => {
          const target = elem.target.getAttribute("href");
          if (target !== "") {
            if (elem.target.nextElementSibling) {
              var submenu = elem.target.nextElementSibling.nextElementSibling;
              submenu.classList.toggle("open");
            }
          }
        });
      });
    }
  };

  const closeMenu = () => {
    // Close the mobile menu (set default hidden state)
    setMenu(true);
  };

  const getClosest = (elem, selector) => {
    if (!Element.prototype.matches) {
      Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function (s) {
          var matches = (this.document || this.ownerDocument).querySelectorAll(
            s
          ),
            i = matches.length;
          while (--i >= 0 && matches.item(i) !== this) { }
          return i > -1;
        };
    }
    for (; elem && elem !== document; elem = elem.parentNode) {
      if (elem.matches(selector)) return elem;
    }
    return null;
  };

  const activateMenu = () => {
    var menuItems = document.getElementsByClassName("sub-menu-item");
    if (menuItems) {
      var matchingMenuItem = null;
      for (var idx = 0; idx < menuItems.length; idx++) {
        if (menuItems[idx].href === window.location.href) {
          matchingMenuItem = menuItems[idx];
        }
      }

      if (matchingMenuItem) {
        matchingMenuItem.classList.add("active");
        var immediateParent = getClosest(matchingMenuItem, "li");
        if (immediateParent) immediateParent.classList.add("active");
        var parent = getClosest(immediateParent, ".child-menu-item");
        if (parent) parent.classList.add("active");
        var parent = getClosest(parent || immediateParent, ".parent-menu-item");
        if (parent) {
          parent.classList.add("active");
          var parentMenuitem = parent.querySelector(".menu-item");
          if (parentMenuitem) parentMenuitem.classList.add("active");
          var parentOfParent = getClosest(parent, ".parent-parent-menu-item");
          if (parentOfParent) parentOfParent.classList.add("active");
        } else {
          var parentOfParent = getClosest(
            matchingMenuItem,
            ".parent-parent-menu-item"
          );
          if (parentOfParent) parentOfParent.classList.add("active");
        }
      }
    }
  };

  const userMenuItems = [
    ...(user?.data?.user?.role === "company"
      ? [
        {
          key: "company-profile",
          label: (
            <Link to="/company-profile" className="flex items-center gap-2">
              <FiUser />
              {t("navbar.profile")}
            </Link>
          ),
        },
      ]
      : user?.data?.user?.role === "candidate"
        ? [
          {
            key: "profile",
            label: (
              <Link to="/profile" className="flex items-center gap-2">
                <FiUser />
                {t("navbar.profile")}
              </Link>
            ),
          },
        ]
        : []),

    ...(user?.data?.user?.role !== "company" &&
      localStorage.getItem("email_verified_at") !== "false"
      ? [
        {
          key: "settings",
          label: (
            <Link
              to="/candidate-profile-setting"
              className="flex items-center gap-2"
            >
              <FiSettings />
              {t("navbar.settings")}
            </Link>
          ),
        },
      ]
      : []),

    {
      key: "logout",
      label: (
        <span
          onClick={() => {
            localStorage.clear();
            navigate("/");
            location.reload();
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FiLogOut />
          {t("navbar.logout")}
        </span>
      ),
    },

  ];

  useEffect(() => {
    if (
      !pathname?.includes("login") &&
      !pathname?.includes("signup") &&
      localStorage.getItem("tokens") &&
      localStorage.getItem("email_verified_at") != "false"
    ) {
      refreshUser();
    }
  }, [pathname]);

  // Close the mobile navigation whenever the route changes
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <nav id="topnav" className={`defaultscroll is-sticky ${topnavClass}`}>
      <div
        className={`${isContainerFluid === true
            ? "container-fluid md:px-8 px-3"
            : "container"
          }`}
      >
        <Link className="logo" to="/">
          <div className="block sm:hidden">
            <img src={logo} className="h-10 inline-block dark:hidden" alt="" />
            <img src={logo} className="h-10 hidden dark:inline-block" alt="" />
          </div>

          {navClass && navClass.includes("nav-light") ? (
            <div className="sm:block hidden">
              <span className="inline-block dark:hidden">
                <img
                  src={logo}
                  className="!h-[80px] l-dark"
                  alt=""
                  style={{ height: 80 }}
                />
                <img
                  src={logo}
                  className="!h-[80px] l-light"
                  alt=""
                  style={{ height: 80 }}
                />
              </span>
              <img
                src={logo}
                className="!h-[80px] hidden dark:inline-block"
                alt=""
                style={{ height: 80 }}
              />
            </div>
          ) : (
            <div className="sm:block hidden">
              <img
                src={logo}
                className="!h-[80px] inline-block dark:hidden"
                alt=""
                style={{ height: 80 }}
              />
              <img
                src={logo}
                className="!h-[80px] hidden dark:inline-block"
                alt=""
                style={{ height: 80 }}
              />
            </div>
          )}
        </Link>

        <div className="menu-extras">
          <div className="menu-item">
            <Link
              to="#"
              className="navbar-toggle"
              id="isToggle"
              onClick={toggleMenu}
            >
              <div className="lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </Link>
          </div>
        </div>

        <ul className="buy-button flex items-center h-74px list-none mb-0">
          {(role === "company" || !role) && (
            <li className="hidden lg:flex items-center mb-0 justify-center h-full me-2">
              <div className="relative top-[3px]">
                <Link
                  to={
                    user && localStorage.getItem("email_verified_at") != "false"
                      ? "job-post"
                      : "login"
                  }
                  className="rounded-3xl h-36px shrink-0 flex"
                  style={{
                    backgroundColor: "oklch(45% 0.18 260.67)",
                    color: "white",
                    padding: "8px 16px",
                    textDecoration: "none",
                  }}
                >
                  {t("navbar.newVacancy")}
                </Link>
              </div>
            </li>
          )}

          {(role === "company" || !role) && (
            <li className="hidden lg:flex items-center mb-0 justify-center h-full me-2">
              <div className="relative top-[3px]">
                <Link
                  to="/pricing"
                  className="rounded-3xl h-36px shrink-0 flex items-center gap-2"
                  style={{
                    backgroundColor: "oklch(45% 0.18 260.67)",
                    color: "white",
                    padding: "8px 16px",
                    textDecoration: "none",
                  }}
                >
                  {t("common.plans")}
                </Link>
              </div>
            </li>
          )}

          <li className="flex items-center mb-0 justify-center h-full">
            <div className="relative top-[3px]">
              <LuSearch className="text-lg absolute top-[8px] end-3" />
              <input
                type="text"
                className="py-2 px-3 text-[14px] w-110 border border-gray-100 dark:border-gray-800 dark:text-slate-200 outline-none h-9 !pe-10 rounded-3xl bg-white dark:bg-slate-900 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={t("navbar.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </li>

          {role && (
            <li className="dropdown flex h-full items-center relative ps-1">
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <span className="size-9 mt-5px inline-flex items-center justify-center rounded-full cursor-pointer border border-emerald-600 hover:border-emerald-700">
                  <img
                    src={avatarUrl}
                    className="rounded-full w-full h-full"
                    alt="avatar"
                  />
                </span>
              </Dropdown>
            </li>
          )}

          {!role && (
            <li className="flex items-center mb-0 justify-center h-full ml-2">
              <div className="relative top-[3px]">
                <Link
                  to="/login"
                  className="rounded-3xl h-36px shrink-0 flex w-36px"
                  style={{
                    backgroundColor: "white",
                    color: "white",
                    padding: "8px 8px",
                    textDecoration: "none",
                    display: "flex",
                  }}
                >
                  <img
                    style={{ height: "18px", color: "white" }}
                    src={LoginIcon}
                  />
                </Link>
              </div>
            </li>
          )}

          <li className="dropdown flex h-full items-center relative ps-1">
            <Dropdown
              menu={{
                items: languageItems,
                onClick: handleLanguageChange,
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                size="small"
                className="border-blue-500 text-blue-600 h-36px shrink-0 font-medium px-3 flex items-center gap-1 rounded-3xl"
                style={{
                  padding: "5px",
                  borderRadius: "1.5rem",
                  marginTop: 5,
                  boxSizing: "border-box",
                }}
              >
                {currentLang.toUpperCase()}
                <DownOutlined />
              </Button>
            </Dropdown>
          </li>
        </ul>

        <div
          id="navigation"
          className={`${isOpen === true ? "!hidden-md" : "!block"}`}
        >
          <ul className={`navigation-menu ${navClass}`}>
            <li>
              <Link to="/companies" onClick={closeMenu}>
                {t("navbar.companies")}
              </Link>
            </li>

            <li>
              <Link to="/vacancies" onClick={closeMenu}>
                {t("navbar.vacancies")}
              </Link>
            </li>

            <li>
              <Link to="/candidates" onClick={closeMenu}>
                {t("navbar.candidates")}
              </Link>
            </li>

            <li>
              <Link to="/aboutus" onClick={closeMenu}>
                {t("navbar.aboutUs")}
              </Link>
            </li>

            <li>
              <Link to="/contact" onClick={closeMenu}>
                {t("navbar.contactUs")}
              </Link>
            </li>

            <li className="block lg:hidden pb-4 px-4 custom_new_vacancy_btn">
              <div className="flex items-center gap-2">
                <Link
                  to={user ? "/job-post" : "/login"}
                  onClick={closeMenu}
                  className="rounded-3xl w-fit"
                  style={{
                    backgroundColor: "oklch(45% 0.18 260.67)",
                    color: "white",
                    padding: "8px 16px",
                    textDecoration: "none",
                  }}
                >
                  {t("navbar.newVacancy")}
                </Link>

                {(role === "company" || !role) && (
                  <Link
                    to="/pricing"
                    onClick={closeMenu}
                    className="rounded-3xl w-fit flex items-center gap-2"
                    style={{
                      backgroundColor: "oklch(45% 0.18 260.67)",
                      color: "white",
                      padding: "8px 16px",
                      textDecoration: "none",
                    }}
                  >
                    {t("common.plans")}
                  </Link>
                )}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default memo(Navbar);
