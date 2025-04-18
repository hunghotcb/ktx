const { MongoClient } = require("mongodb");

async function run() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("local");

        const result = await db.collection("student_services").aggregate([
            {
                $lookup: {
                    from: "services",
                    localField: "service_id",
                    foreignField: "_id",
                    as: "service"
                }
            },
            { $unwind: "$service" },
            {
                $addFields: {
                    month: { $substr: ["$used_at", 0, 7] }  // tách chuỗi để lấy yyyy-mm
                }
            },
            {
                $group: {
                    _id: {
                        service_id: "$service_id",
                        service_name: "$service.name",
                        month: "$month"
                    },
                    total_revenue: { $sum: "$total" }
                }
            },
            {
                $project: {
                    _id: 0,
                    service_id: "$_id.service_id",
                    service_name: "$_id.service_name",
                    month: "$_id.month",
                    total_revenue: 1
                }
            },
            { $sort: { month: 1, service_id: 1 } }
        ]).toArray();

        console.table(result);
    } catch (err) {
        console.error("Lỗi truy vấn:", err);
    } finally {
        await client.close();
    }
}

run();
