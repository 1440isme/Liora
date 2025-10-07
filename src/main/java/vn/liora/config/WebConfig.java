package vn.liora.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Cấu hình static resources cho CSS, JS, images
        registry.addResourceHandler("/user/**")
                .addResourceLocations("classpath:/static/user/")
                .setCachePeriod(3600);

        // Admin static resources - SỬA LẠI
        registry.addResourceHandler("/admin/css/**")
                .addResourceLocations("classpath:/static/admin/css/")
                .setCachePeriod(3600);
                
        registry.addResourceHandler("/admin/js/**")
                .addResourceLocations("classpath:/static/admin/js/")
                .setCachePeriod(3600);
                
        registry.addResourceHandler("/admin/images/**")
                .addResourceLocations("classpath:/static/admin/images/")
                .setCachePeriod(3600);
                
        registry.addResourceHandler("/admin/fonts/**")
                .addResourceLocations("classpath:/static/admin/fonts/")
                .setCachePeriod(3600);
                
        registry.addResourceHandler("/admin/vendors/**")
                .addResourceLocations("classpath:/static/admin/vendors/")
                .setCachePeriod(3600);

        // Other static resources
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/")
                .setCachePeriod(3600);

        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/")
                .setCachePeriod(3600);

        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/")
                .setCachePeriod(3600);

        registry.addResourceHandler("/fonts/**")
                .addResourceLocations("classpath:/static/fonts/")
                .setCachePeriod(3600);

        registry.addResourceHandler("/vendors/**")
                .addResourceLocations("classpath:/static/vendors/")
                .setCachePeriod(3600);

        // Cấu hình cho upload files
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:./uploads/")
                .setCachePeriod(3600);
    }
}