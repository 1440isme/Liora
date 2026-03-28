package vn.liora.service.Authen;

import vn.liora.entity.User;
import java.util.Map;

public interface LoginStrategy {
    User login(Map<String, Object> attributes);
}
