const prisma = require("../config/prisma");
const { rolePower } = require("../utils/viewHelpers");

const ADMIN_ROLES = [
  "ADMINISTRADOR",
  "SUPERVISOR",
  "COORDENADOR",
  "GERENTE",
  "SUB_DIRETOR",
  "DIRETOR",
  "DESENVOLVEDOR",

  // Legado temporário
  "ADMIN",
  "OWNER"
];
const VALID_STATUSES = ["ALL", "OPEN", "CLOSED", "PINNED", "ARCHIVED"];

const renderStaffHome = async (req, res) => {
  try {
    const playerRole = req.session.playerRole || "PLAYER";
    const isAdminStaff = rolePower(playerRole) >= 4;

    const status = VALID_STATUSES.includes(req.query.status)
      ? req.query.status
      : "ALL";

    const reportPage = Math.max(parseInt(req.query.reportPage || "1", 10), 1);
    const topicPage = Math.max(parseInt(req.query.topicPage || "1", 10), 1);

    const reportsPerPage = 6;
    const topicsPerPage = 10;

    const reportSkip = (reportPage - 1) * reportsPerPage;
    const topicSkip = (topicPage - 1) * topicsPerPage;

    const topicWhere = status === "ALL" ? {} : { status };

    const reportWhere = {
      category: {
        slug: "denuncias"
      },
      ...(status === "ALL" ? {} : { status })
    };

    const reports = await prisma.forumTopic.findMany({
      where: reportWhere,
      orderBy: {
        updatedAt: "desc"
      },
      skip: reportSkip,
      take: reportsPerPage,
      include: {
        author: true,
        category: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    const topics = await prisma.forumTopic.findMany({
      where: topicWhere,
      orderBy: {
        updatedAt: "desc"
      },
      skip: topicSkip,
      take: topicsPerPage,
      include: {
        author: true,
        category: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    const totalReports = await prisma.forumTopic.count({
      where: reportWhere
    });

    const openReports = await prisma.forumTopic.count({
      where: {
        category: {
          slug: "denuncias"
        },
        status: {
          in: ["OPEN", "PINNED"]
        }
      }
    });

    const filteredTopicsCount = await prisma.forumTopic.count({
      where: topicWhere
    });

    const usersCount = isAdminStaff
      ? await prisma.user.count()
      : 0;

    let medalsCount = 0;

    if (isAdminStaff && prisma.medal) {
      medalsCount = await prisma.medal.count();
    }

    res.render("pages/staff-home", {
      title: "Central Staff - SurvivalZ",
      playerRole,
      isAdminStaff,
      status,
      reports,
      topics,
      overview: {
        openReports,
        filteredTopicsCount,
        usersCount,
        medalsCount
      },
      pagination: {
        reports: {
          page: reportPage,
          perPage: reportsPerPage,
          total: totalReports,
          totalPages: Math.max(Math.ceil(totalReports / reportsPerPage), 1)
        },
        topics: {
          page: topicPage,
          perPage: topicsPerPage,
          total: filteredTopicsCount,
          totalPages: Math.max(Math.ceil(filteredTopicsCount / topicsPerPage), 1)
        }
      }
    });
  } catch (error) {
    console.log("Erro ao carregar central staff:", error);
    res.status(500).send("Erro ao carregar central staff.");
  }
};

const renderStaffReports = (req, res) => {
  res.redirect("/staff#staff-reports");
};

module.exports = {
  renderStaffHome,
  renderStaffReports
};
