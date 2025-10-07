package vn.liora.controller.user;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;

@Controller
@RequestMapping({ "/", "/home" })
public class HomeController {

    // Dashboard
    @GetMapping()
    public String dashboard() {
        return "user/index";
    }

    // Auth pages
    @GetMapping("/login")
    public String login() {
        return "admin/auth/login";
    }

    @GetMapping("/test-upload")
    public void testUpload(HttpServletResponse response) throws IOException {
        response.setContentType("text/html");
        response.setCharacterEncoding("UTF-8");

        String html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Upload</title>
        </head>
        <body>
            <h1>Test Upload Brand Logo</h1>
            <form id="uploadForm">
                <input type="file" id="fileInput" accept="image/*">
                <button type="submit">Upload</button>
            </form>
            <div id="result"></div>

            <script>
                document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const fileInput = document.getElementById('fileInput');
                    const file = fileInput.files[0];

                    if (!file) {
                        alert('Please select a file');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                        console.log('Uploading file:', file.name);

                        const response = await fetch('/admin/api/upload/brands', {
                            method: 'POST',
                            body: formData
                        });

                        console.log('Response status:', response.status);

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Upload failed:', response.status, errorText);
                            document.getElementById('result').innerHTML = `<p style="color: red;">Error: ${response.status} - ${errorText}</p>`;
                            return;
                        }

                        const result = await response.json();
                        console.log('Upload response:', result);

                        document.getElementById('result').innerHTML = `
                                <p style="color: green;">Success!</p>
                                <p>Original URL: ${result.result.originalUrl}</p>
                                <p>Thumbnail URL: ${result.result.thumbnailUrl}</p>
                            `;

                    } catch (error) {
                        console.error('Upload error:', error);
                        document.getElementById('result').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                    }
                });
            </script>
        </body>
        </html>
        """;

        response.getWriter().write(html);
    }
}
