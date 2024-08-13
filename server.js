const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 33000;
const JWT_SECRET = process.env.JWT_SECRET || 'saflkndvkljdsldkshfdshgf324cvmpsdlkor39320';
const REGISTRATION_SECRET_CODE = process.env.REGISTRATION_SECRET_CODE || 'default_registration_secret_code';


// Подключение к MongoDB
mongoose.connect('mongodb://mongo:27017/TelegaUrl', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Схема и модель для администратора
const AdminSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
});

const Admin = mongoose.model('Admin', AdminSchema);

// Схема и модель для страниц
const PageSchema = new mongoose.Schema({
    title: String,
    path: { type: String, unique: true },
    html: String,
    images: { type: Map, of: String }, // если изображения хранятся как ключ-значение
});

const Page = mongoose.model('Page', PageSchema);

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Извлекаем токен из заголовка

    if (!token) {
        return res.status(401).json({ message: 'Токен отсутствует' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Неверный или истекший токен' });
        }

        req.user = user; // Сохраняем пользователя в запросе для дальнейшего использования
        next();
    });
};


// Маршрут для регистрации
app.post('/api/auth/register', async (req, res) => {
    const { username, password, secretCode } = req.body;

    try {
        if (secretCode !== REGISTRATION_SECRET_CODE) {
            return res.status(403).json({ message: 'Неверный проверочный код' });
        }

        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Администратор с таким именем уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({ username, password: hashedPassword });
        await admin.save();

        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ message: 'Администратор зарегистрирован успешно', token });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при регистрации администратора', error });
    }
});

// Маршрут для входа
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
        }

        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при входе', error });
    }
});

// Маршрут для проверки токена
app.post('/api/auth/verify-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Извлекаем токен из заголовка

    if (!token) {
        return res.status(401).json({ message: 'Токен отсутствует' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Неверный или истекший токен' });
        }

        res.status(200).json({ message: 'Токен действителен', user });
    });
});

// Все маршруты ниже требуют аутентификации
app.use('/api/pages', authenticateToken);

// // Маршрут для получения всех страниц
// app.get('/api/pages', async (req, res) => {
//     try {
//         const pages = await Page.find({});
//         res.json(pages);
//     } catch (error) {
//         res.status(500).json({ message: 'Ошибка при получении страниц', error });
//     }
// });

// Маршрут для получения всех страниц с пагинацией
app.get('/api/pages', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pages = await Page.find({})
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Page.countDocuments();

        res.json({
            pages,
            total,
            page: Number(page),
            pagesCount: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении страниц', error });
    }
});


// Маршрут для получения страницы по пути
app.get('/api/pages/:path', async (req, res) => {
    try {
        const page = await Page.findOne({ path: req.params.path });
        if (!page) {
            return res.status(404).json({ message: 'Страница не найдена' });
        }
        res.json(page);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении страницы', error });
    }
});

// Маршрут для создания или обновления страницы
app.post('/api/pages', async (req, res) => {
    const { _id, title, path, html, images } = req.body;

    try {
        if (_id) {
            const updatedPage = await Page.findByIdAndUpdate(_id, { title, path, html, images }, { new: true });
            if (!updatedPage) {
                return res.status(404).json({ message: 'Страница не найдена для обновления' });
            }
            res.json({ message: 'Страница успешно обновлена', page: updatedPage });
        } else {
            const newPage = new Page({ title, path, html, images });
            await newPage.save();
            res.json({ message: 'Страница успешно создана', page: newPage });
        }
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при сохранении страницы', error });
    }
});

// Маршрут для удаления страницы
app.delete('/api/pages/:id', async (req, res) => {
    try {
        const deletedPage = await Page.findByIdAndDelete(req.params.id);
        if (!deletedPage) {
            return res.status(404).json({ message: 'Страница не найдена для удаления' });
        }
        res.json({ message: 'Страница успешно удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении страницы', error });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
