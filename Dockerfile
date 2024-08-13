FROM node:18

# Установка рабочей директории
WORKDIR /usr/src/app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Экспонирование порта
EXPOSE 33000

# Запуск приложения
CMD ["node", "server.js"]
