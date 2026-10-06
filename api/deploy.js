export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { projectName, html } = req.body || {};

    if (!projectName || !html) {
      return res.status(400).json({
        error: "projectName dan html wajib diisi"
      });
    }

    const token = process.env.VERCEL_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "VERCEL_TOKEN belum dipasang di server"
      });
    }

    const name = projectName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    if (!name) {
      return res.status(400).json({
        error: "Nama project tidak valid"
      });
    }

    const response = await fetch(
      "https://api.vercel.com/v13/deployments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          files: [
            {
              file: "index.html",
              data: html
            }
          ],
          projectSettings: {
            framework: null
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.error?.code ||
          "Deployment gagal"
      });
    }

    return res.status(200).json({
      success: true,
      project: name,
      url: `https://${data.url}`,
      deploymentId: data.id
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
