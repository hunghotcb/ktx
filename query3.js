const { MongoClient } = require("mongodb");

async function run() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("local");

        // Mốc thời gian lọc (ví dụ tháng 4 năm 2025)
        const start = "2023-04-01";
        const end = "2025-04-30";

        const result = await db.collection("guests").aggregate([
            {
                $match: {
                    visit_date: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "visited_student",
                    foreignField: "_id",
                    as: "student"
                }
            },
            { $unwind: "$student" },
            {
                $group: {
                    _id: {
                        student_id: "$visited_student",
                        student_name: "$student.name",
                        guest_name: "$name",
                        guest_cmt: "$cmt",
                        guest_dob: "$dob"
                    },
                    visit_count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    student_id: "$_id.student_id",
                    student_name: "$_id.student_name",
                    guest_name: "$_id.guest_name",
                    guest_cmt: "$_id.guest_cmt",
                    guest_dob: "$_id.guest_dob",
                    visit_count: 1
                }
            }
        ]).toArray();

        console.table(result);
    } catch (err) {
        console.error("Lỗi truy vấn:", err);
    } finally {
        await client.close();
    }
}

run();
