import cors from 'cors';
import ExcelJS from 'exceljs';
import express from 'express';
import mysql from 'mysql';
import PDFDocument from 'pdfkit';



const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'info'
});

app.get('/student', (req, res) => {
    const searchTerm = req.query.search; // Get the search term from the query parameters
    let sql = "SELECT * FROM student";
    if (searchTerm) {
        sql += ` WHERE name LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%'`;
    }
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.json({ Message: "Error fetching data" });
        }

        res.json(result);
    });
});

// POST endpoint to add a new student
app.post('/addstudent', (req, res) => {
    const { id, name, email } = req.body;
    const sql = "INSERT INTO student (id, name, email) VALUES (?, ?, ?)";
    db.query(sql, [id, name, email], (err, result) => {
        if (err) {
            console.error('Error adding student:', err);
            return res.status(500).json({ message: 'Error adding student' });
        }
        console.log('Student added successfully');
        res.status(201).json({ message: 'Student added successfully' });
    });
});

// PUT endpoint to update a student record
app.put('/editStudent/:id', (req, res) => {
    const { name, email } = req.body;
    const id = req.params.id;
    const sql = "UPDATE student SET name=?, email=? WHERE id=?";
    db.query(sql, [name, email, id], (err, result) => {
        if (err) {
            console.error('Error updating student:', err);
            return res.status(500).json({ message: 'Error updating student' });
        }
        console.log('Student updated successfully');
        res.json({ message: 'Student updated successfully' });
    });
});

// DELETE endpoint to delete a student record
app.delete('/deleteStudent/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM student WHERE id=?";
    db.query(sql, id, (err, result) => {
        if (err) {
            console.error('Error deleting student:', err);
            return res.status(500).json({ message: 'Error deleting student' });
        }
        console.log('Student deleted successfully');
        res.json({ message: 'Student deleted successfully' });
    });
});


//EXCEL
app.get('/exportToExcel', (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    db.query("SELECT * FROM student", (err, result) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ message: 'Error exporting to Excel' });
        }

        // Convert result to array of arrays
        const data = result.map(row => [row.id, row.name, row.email]);

        // Add data to worksheet
        worksheet.addRows(data);

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

        // Send workbook as response
        workbook.xlsx.write(res)
            .then(() => {
                console.log('Data exported to Excel successfully');
                res.end();
            })
            .catch(err => {
                console.error('Error exporting to Excel:', err);
                res.status(500).json({ message: 'Error exporting to Excel' });
            });
    });
});



// Add a new endpoint for exporting data to PDF
app.get('/exportToPDF', (req, res) => {
    const doc = new PDFDocument();
    doc.pipe(res);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=students.pdf');

    // Fetch data from the database
    db.query("SELECT * FROM student", (err, result) => {
        if (err) {
            console.error('Error fetching data:', err);
            doc.end();
            return res.status(500).json({ message: 'Error exporting to PDF' });
        }

        // Stream data into PDF
        result.forEach(row => {
            doc.text(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
        });

        // Finalize PDF
        doc.end();
    });
});



// Other routes...

app.listen(8081, () => {
    console.log("Server is Running ...");
});